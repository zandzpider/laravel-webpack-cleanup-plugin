import polyfill from 'babel-polyfill'

import fs from 'fs'
import path, {resolve} from 'path'
import WebpackOnBuildPlugin from 'on-build-webpack'

function LaravelWebpackCleanupPlugin(directory, {manifest = 'assets/build/rev-manifest.json', exclude, preview, quiet}) {
    manifest = manifest ? resolve(process.cwd(), manifest) : {};
    exclude  = exclude ? [].concat(exclude) : [];

    return new WebpackOnBuildPlugin(function () {
        let ignore = readManifest(directory, manifest);
        let deletedFiles = cleanDirectory(directory, ignore, exclude, preview);

        if ( ! preview) {

            if ( ! quiet) {
                console.log('WebpackCleanupPlugin: %s file(s) deleted.\n', deletedFiles.length);
            }

            return deletedFiles;
        }

        console.log('%s file(s) would be deleted:', deletedFiles.length);
        deletedFiles.forEach(file => console.log('    %s', file));
        console.log();
    })
}

function cleanDirectory(directory, ignore, exclude, preview) {

    return fs.readdirSync(directory)
        // filter away excluded files
        .filter((file) => {
            return exclude.indexOf(file) === -1;
        })
        // make paths absolute
        .map((filePath) => {
            return resolve(directory, filePath);
        })
        // remove last build files
        .filter((filePath) => {
            return ignore.indexOf(filePath) === -1;
        })
        // filter results from removal
        .filter((filePath) => {
            return !cleanPath(filePath, ignore, preview)
        });
}

function cleanPath(path, ignore, preview) {

    return fs.statSync(path).isDirectory()
        ? cleanDirectory(path, ignore)
        : (preview ? false : fs.unlinkSync(path));
}

function readManifest(directory, manifestPath) {

    try {
        const manifestExists = fs.statSync(manifestPath).isFile();

        if ( ! manifestExists) {
            throw new Error(`Manifest does not exist: ${manifestPath}`);
        }

        // get last build files to keep them
        return Object.values(JSON.parse(fs.readFileSync(manifestPath, 'utf8')))
            // get resolved files
            .map((file) => resolve(directory, path.basename(file)))
            // add manifest to keep it too
            .concat(manifestPath);
    }
    catch (e) {
        throw new Error(e.message);
    }
}

export default LaravelWebpackCleanupPlugin;
module.exports = LaravelWebpackCleanupPlugin;