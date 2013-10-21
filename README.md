[![Build Status](https://magnum.travis-ci.com/goinstant/usercache.png?token=yxZ3kgnG75WoPosksjKb&branch=master)](https://magnum.travis-ci.com/goinstant/usercache)

## Usercache

The Usercache component implements a synchronous interface for working with
GoInstant users and is used in various [GoInstant widgets](https://developers.goinstant.com/v1/widgets/index.html).

## Packaging

#### How do I build the script myself?

You may have your own build process. We've tried to make it easy to include
the Usercache component in your build process.

#### Component

We've packaged the Usercache component as a [component](http://component.io/).

```
component install
```

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

Tests are written in [mocha](http://visionmedia.github.io/mocha/). They're run
in an [HTML file](http://visionmedia.github.io/mocha/#html-reporter).

Just open the test/index.html file to run the tests.

On Mac OS, you can just run this command to open the HTML Runner in your
default browser:

```
open test/index.html
```
