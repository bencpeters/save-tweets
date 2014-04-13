#!/usr/bin/env python
#
# Simple script to listen to a twitter stream and save off tweets to save 
# to an S3 bucket

import json
import os
import sys
import argparse
import multiprocessing 
import time
import shutil
import tempfile
import twitter
import boto.s3
from boto.s3.connection import Location

def handle_cli():
    parser = argparse.ArgumentParser(description="Follows a twitter stream " \
        "and saves off tweets to an Amazon S3 bucket for later processing")
    parser.add_argument('-c', '--config', nargs=1, default='./settings.json',
                        metavar="FILEPATH", help="Configuration File")
    parser.add_argument('-s', '--search', nargs=1, metavar="TERM", \
                        help="Term/Tag/Handle to monitor")
    parser.add_argument('-b', '--bucket-name', nargs=1, metavar="NAME", \
                        help="Name of Amazon S3 bucket to store tweets in")
    return parser.parse_args()

def write_tweet(tweet, file_name, lock=None):
    if tweet['coordinates'] is not None:
        coords = tweet['coordinates']['coordinates']
        geo_string = "%f,%f" % (coords[0], coords[1])
    else:
        geo_string = ","

    str_rep = "%d,\"%s\",%d,%s,%d,%d,%s\n" %  \
              (tweet['id'],
               tweet['text'].replace('\\', "").replace('"', '\\"'),
               tweet['user']['id'],
               tweet['created_at'], 
               tweet['retweet_count'], 
               tweet['favorite_count'],
               geo_string)
    if lock is not None:
        lock.acquire()
    with open(file_name, 'a+') as f:
        f.write(str_rep.encode('utf-8'))
    if lock is not None:
        lock.release()

def send_json_tweet(tweet):
    output = {}
    if tweet['coordinates'] is not None:
        coords = tweet['coordinates']['coordinates']
        output['lat'] = coords[0]
        output['long'] = coords[1]
    else:
        output['lat'] = None
        output['long'] = None

    output['id'] = tweet['id']
    output['text'] = tweet['text'].replace('\\', "").replace('"', '\\"')
    output['user_id'] = tweet['user']['id']
    output['created_at'] = tweet['created_at']
    output['retweet_count'] = tweet['retweet_count']
    output['favorite_count'] = tweet['favorite_count']

    sys.stdout.write(json.dumps({'tweet': output}))
    sys.stdout.flush()

def get_valid_location(location_string):
    s3_locations = { 'us-east-1': Location.DEFAULT,
                     'us-west-1': Location.USWest,
                     'us-west-2': Location.USWest2,
                     'eu-west-1': Location.EU,
                     'ap-southeast-1': Location.APSoutheast,
                     'ap-southeast-2': Location.APSoutheast2,
                     'ap-northeast-1': Location.APNortheast,
                     'sa-east-1': Location.SAEast }

    if location_string not in [i for i in dir(boto.s3.connection.Location) \
                               if i[0].isupper()]:
        try:
            return s3_locations[location_string]
        except KeyError:
            raise ValueError("%s is not a known AWS location. Valid choices " \
                 "are:\n%s" % (location_string,  "\n".join( \
                 ["  *%s" % i for i in s3_locations.keys()])))
    else:
        return getattr(Location, location_string)

def write_to_s3(bucket, local_filename, lock, search_term, sleep_time=60):
    while True:
        try:
            time.sleep(sleep_time)
            size = os.path.getsize(local_filename)
            if size > 50000:
                with tempfile.NamedTemporaryFile() as f:
                    lock.acquire()
                    shutil.copyfile(local_filename, f.name)
                    os.remove(local_filename)
                    lock.release()
                    k = boto.s3.connection.Key(bucket)
                    time_str = time.strftime("%Y%m%d-%H%M%S", time.gmtime())
                    k.key = "%s-%s.csv" % (search_term, time_str)
                    k.set_contents_from_filename(f.name)
        except OSError:
            pass

if __name__ == "__main__":
    options = handle_cli()
    
    try:
        with open(options.config, 'r') as f:
            settings = json.loads(f.read())
    except IOError:
        settings = {}
    
    get_arg = lambda key, default: settings[key] if key in settings else \
                                   default
    get_arg_env = lambda key, env_var: settings[key] if key in settings else \
                                       os.environ[env_var]

    token = get_arg_env('twitterToken', 'TWITTER_TOKEN')
    token_secret = get_arg_env('twitterTokenSecret', 'TWITTER_TOKEN_SECRET')
    api_key = get_arg_env('twitterAPIKey', 'TWITTER_API_KEY')
    api_secret = get_arg_env('twitterAPISecret', 'TWITTER_API_SECRET')
    auth = twitter.OAuth(token, token_secret, api_key, api_secret)
    t = twitter.TwitterStream(auth=auth)

    aws_key = get_arg_env('AWSKey', 'AWS_KEY')
    aws_secret = get_arg_env('AWSSecret', 'AWS_SECRET')
    location = get_arg('S3BucketLocation', 'us-west-2')
    conn = boto.s3.connect_to_region(location, aws_access_key_id=aws_key, \
                                     aws_secret_access_key=aws_secret)

    bucket_name = get_arg('S3BucketName', options.bucket_name)
    search_term = get_arg('searchTerm', options.search)

    local_file = "./temp-tweets.csv"

    try:
        bucket = conn.get_bucket(bucket_name)
    except boto.exception.S3ResponseError:
        print("Trying to create a bucket %s in %s" % (bucket_name, location))
        bucket = conn.create_bucket(bucket_name, \
                                    location=get_valid_location(location))

    lock = multiprocessing.Lock()
    p = multiprocessing.Process(target=write_to_s3, \
                                args=[bucket, local_file, lock, search_term])
    p.start()

    while True:
        try:
            for tweet in t.statuses.filter(track=search_term):
                write_tweet(tweet, local_file, lock)            
                send_json_tweet(tweet)
        except Exception as e:
            sys.stderr.write("Problem saving tweets: %s" % e)
            sys.stderr.flush()
