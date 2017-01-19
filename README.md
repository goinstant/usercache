[![Build Status](https://travis-ci.org/goinstant/usercache.png?branch=master)](https://travis-ci.org/goinstant/usercache)

# Usercache

The Usercache component implements a synchronous interface for working with
GoInstant users and is used in various [GoInstant widgets](https://developers.goinstant.com/v1/widgets/index.html).

## Contributing

### Development Dependencies

- [node.js](http://nodejs.org/) >= 0.8.0
- [grunt-cli installed globally](http://gruntjs.com/getting-started)
  - `npm install -g grunt-cli`

### Set-Up

The following assumes that you have already installed the dependencies above.

```
git clone https://github.com/goinstant/usercache.git
cd usercache
npm install
```

#### Building Usercache for Development

Usercache is built as a [component](https://github.com/component/component).
Feel free to manually install dependencies and build using the `component`
command line tool.

For convenience, we've included a simple grunt command for installing
component dependencies and building:

```
grunt build
```

If this command runs succesfully you'll now have `components` and `build`
directories in your Git repo root.

### Running Tests

Tests are written in [mocha](http://mochajs.org/). They're run
in an [HTML file](http://visionmedia.github.io/mocha/#html-reporter).

Just open the test/index.html file to run the tests.

On Mac OS, you can just run this command to open the HTML Runner in your
default browser:

```
open test/index.html
```
