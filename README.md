Save Tweets Application
=======================
This application is a utility that monitors a given 'search' on Twitter (e.g. `@skullcandy` mentions) and
saves tweets to an Amazon AWS S3 bucket.

Install
-------
To install this application, you must have Node.js and Python installed. Because this package relies on external
libraries, the python package manager `pip` is reccomended as well.

### Install Python dependencies
```bash
pip install -r requirements.txt
```

### Install Node dependencies
```bash
npm install
```
### Other
For non-development purposes, some kind of supervisor process is reccomended to deploy the server. There are a ton of options
for deploying a node server, but one of the easiest is to use [Supervisor](http://supervisord.org/).

#### Example supervisor config
```
[save-tweets]
command=nodejs app.js                   ; the program (relative uses PATH, can take args)
directory=/home/benpeters/save-tweets   ; directory to cwd to before exec (def no cwd)
process_name=save-tweets                ; process_name expr (default %(program_name)s)
autorestart=true                        ; whether/when to restart (default: unexpected)
startsecs=1                             ; number of secs prog must stay running (def. 1)
stopwaitsecs=10                         ; max num secs to wait b4 SIGKILL (default 10)
stdout_logfile=/var/log/save-tweets.log ; stdout log path, NONE for none default AUTO
stderr_logfile=/var/log/save-tweets.err.log ; stderr log path, NONE for none default AUTO
environment=NODE_ENV="production", PORT=80
```
(note - this assumes you have node from the Ubuntu package `nodejs`. The command may be `node` rather than `nodejs` on other configurations)

```
sudo service supervisor start
```

Configuration
-------------
To configure the package, you must first create a user account to login with. (unauthorized users are not allowed to view tweets/save settings).
User accounts are kept track of in the file `users.json`. An example file:

```json
[
    { 
        "userName": "myUserName",
        "password": "password"
    },
    { 
        "userName": "myOtheruser",
        "password": "password"
    }
]
```
Modify this file, then restart the web server to login and edit credentials. You will be directed to the dashboard
to save settings after logging in.

