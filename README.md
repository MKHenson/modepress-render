# modepress-render
Modepress render is a server that runs in conjunction with modepress and allows you to pre-render the pages for SEO and web crawling

## Current stable version
* v0.0.2

## Requirements
* [MongoDB v3](https://www.mongodb.org/)
* [Node](https://nodejs.org/)
* [PhantomJS](http://phantomjs.org/)
* **Tested Ubuntu v14**

## Installation

1) Make sure the requirements are installed and running (phantom js is discussed on point 4)
2) Create a folder where you want to store modepress-render

```
mkdir modepress-render
cd modepress-render
```

3) Run as an admin / or make sure you have write privileges in the modepress folder
```
sudo su
```

4) Install phantomjs. We have created a shell script that will attempt to install
it - but please [read this](ubuntu-phantom-install.md) for more information.

(Credit goes to https://gist.github.com/julionc/7476620 for the original script)

```
curl -o- https://raw.githubusercontent.com/MKHenson/modepress-render/dev/install-phantom.sh | bash
```

5) Download and install the desired version from github
If you want the latest stable version:

```
curl -o- https://raw.githubusercontent.com/MKHenson/modepress-render/master/install-script.sh | bash
```

OR if you want the dev build

```
curl -o- https://raw.githubusercontent.com/MKHenson/modepress-render/dev/install-script-dev.sh | bash
```

6) Run NPM update

```
sudo npm update
```

Make sure you run the command as 'sudo' even if you if whoami is root

7) Edit the config.json with your setup

8) Run modepress-render

```
node main.js --config="config.json" --logFile="logs.log" --logging="true"
```

Ideally however you will want this to be run as an upstart script using something like foreverjs

9) Make sure the url is specified in the config file of the modepress site
eg:
```
 "modepressRenderURL": "http://localhost:3000",
 ```