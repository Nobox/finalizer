# Finalizer
CLI client for Finalizer Server. Prepares and downloads npm builds without stressing your site. **This project is still under development. Things will break.**

## Installation
After setting up your npm build server with Finalizer Server. Install this CLI client globally
```bash
npm install -g finalizer
```

## Creating a project
This command will create (or link) the current project to the build server. This should be done only once. Once the project is created it will trigger the first build on the server.
- `<name>` Project name. The name used here will be stored on the server for later access.

```bash
finalizer create <name>
```

## Download latest build
This will download the latest npm dependencies from the build server. The project must exist already on the build server, created with the `create` command.
```bash
finalizer download <name>
```

This command will:
- Download the dependencies in a compressed `.tar` file.
- Extract them and run `npm rebuild` to relink these dependencies.

## Build project
This command will trigger a new build on the build server. The project must exist already on the build server, created with the `create` command.
```bash
finalizer build <name>
```
If the `package.json` has not changed since the last build, the build will not be created. This will prevent the creation of innecesary builds on the server.

## Development
After cloning your repo
```bash
git clone git@github.com:yourusername/finalizer.git && cd finalizer
```

Install your dependencies with `npm`
```bash
npm install
```

Tests are written with `Mocha` and `expect.js`, run the test suite with:
```bash
npm test
```

## License
MIT
