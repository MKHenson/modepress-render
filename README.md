# modepress-render
Modepress render is a server that runs in conjunction with modepress and allows you to pre-render the pages for SEO and web crawling

## Current stable version
* v0.0.2

## Requirements
* MongoDB v3
* Node
* **Tested Ubuntu v14**

## Installation

1) Make sure the requirements are installed and running
2) Create a folder where you want to store modepress-render

```
mkdir modepress-render
cd modepress-render
```

3) Run as an admin / or make sure you have write privileges in the modepress folder
```
sudo su
```

4) Download and install the desired version from github
If you want the latest stable version:

```
curl -o- https://raw.githubusercontent.com/MKHenson/modepress-render/master/install-script.sh | bash
```

OR if you want the dev build

```
curl -o- https://raw.githubusercontent.com/MKHenson/modepress-render/dev/install-script-dev.sh | bash
```

5) Run NPM update

```
npm update
```

6) Edit the config.json with your setup

7) Run modepress-render

```
node main.js --config="config.json" --logFile="logs.log" --logging="true"
```