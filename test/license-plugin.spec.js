/**
 * The MIT License (MIT)
 *
 * Copyright (c) 2016 Mickael Jeanroy
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const moment = require('moment');
const LicensePlugin = require('../dist/license-plugin.js');

describe('LicensePlugin', () => {
  // eslint-disable-next-line
  var tmpDir;

  beforeEach(() => {
    tmpDir = tmp.dirSync({
      unsafeCleanup: true,
    });
  });

  it('should initialize instance', () => {
    const plugin = new LicensePlugin();
    expect(plugin._cwd).toBeDefined();
    expect(plugin._pkg).toBeDefined();
    expect(plugin._dependencies).toEqual({});
  });

  it('should load pkg', () => {
    const plugin = new LicensePlugin();
    const id = path.join(__dirname, 'fixtures', 'fake-package', 'src', 'index.js');

    spyOn(plugin, 'addDependency').and.callThrough();

    const result = plugin.load(id);

    expect(result).not.toBeDefined();
    expect(plugin.addDependency).toHaveBeenCalled();
    expect(plugin._dependencies).toEqual({
      'fake-package': {
        name: 'fake-package',
        version: '1.0.0',
        description: 'Fake package used in unit tests',
        license: 'MIT',
        private: true,
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
        },
      },
    });
  });

  it('should load pkg and stop on cwd', () => {
    const plugin = new LicensePlugin();
    const id = path.join(__dirname, '..', 'src', 'index.js');

    spyOn(plugin, 'addDependency').and.callThrough();

    const result = plugin.load(id);

    expect(result).not.toBeDefined();
    expect(plugin.addDependency).not.toHaveBeenCalled();
    expect(plugin._dependencies).toEqual({});
  });

  it('should load pkg and update cache', () => {
    const plugin = new LicensePlugin();
    const fakePackage = path.join(__dirname, 'fixtures', 'fake-package');
    const id = path.join(fakePackage, 'src', 'index.js');
    const pkg = require(path.join(fakePackage, 'package.json'));

    plugin.load(id);

    expect(plugin._dependencies).toEqual({
      'fake-package': {
        name: 'fake-package',
        version: '1.0.0',
        description: 'Fake package used in unit tests',
        license: 'MIT',
        private: true,
        author: {
          name: 'Mickael Jeanroy',
          email: 'mickael.jeanroy@gmail.com',
        },
      },
    });

    expect(plugin._cache).toEqual({
      [path.join(__dirname, 'fixtures', 'fake-package', 'src')]: pkg,
      [path.join(__dirname, 'fixtures', 'fake-package')]: pkg,
    });
  });

  it('should load pkg and put null without package', () => {
    const plugin = new LicensePlugin();
    const id = path.join(__dirname, '..', 'src', 'index.js');

    plugin.load(id);

    expect(plugin._dependencies).toEqual({});
    expect(plugin._cache).toEqual({
      [path.normalize(path.join(__dirname, '..', 'src'))]: null,
    });
  });

  it('should load pkg and use the cache if available', () => {
    const plugin = new LicensePlugin();
    const fakePackage = path.join(__dirname, 'fixtures', 'fake-package');
    const id = path.join(fakePackage, 'src', 'index.js');

    plugin._cache[path.join(fakePackage, 'src')] = null;
    plugin._cache[fakePackage] = null;

    spyOn(fs, 'existsSync').and.callThrough();

    plugin.load(id);

    expect(plugin._dependencies).toEqual({});
    expect(fs.existsSync).not.toHaveBeenCalled();
  });

  it('should add dependency', () => {
    const plugin = new LicensePlugin();
    const pkg = {
      name: 'foo',
      version: '0.0.0',
      author: {name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'},
      contributors: [{name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'}],
      description: 'Fake Description',
      main: 'src/index.js',
      license: 'MIT',
      homepage: 'https://www.google.fr',
      private: true,
      repository: {type: 'GIT', url: 'https://github.com/npm/npm.git'},
    };

    plugin.addDependency(pkg);

    expect(plugin._dependencies.foo).toBeDefined();
    expect(plugin._dependencies.foo).not.toBe(pkg);
    expect(plugin._dependencies).toEqual({
      foo: {
        name: 'foo',
        version: '0.0.0',
        author: {name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'},
        contributors: [{name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'}],
        description: 'Fake Description',
        license: 'MIT',
        homepage: 'https://www.google.fr',
        private: true,
        repository: {
          type: 'GIT',
          url: 'https://github.com/npm/npm.git',
        },
      },
    });
  });

  it('should add dependency and parse author field', () => {
    const plugin = new LicensePlugin();
    const pkg = {
      name: 'foo',
      version: '0.0.0',
      author: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      contributors: [{name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'}],
      description: 'Fake Description',
      main: 'src/index.js',
      license: 'MIT',
      homepage: 'https://www.google.fr',
      private: true,
      repository: {type: 'GIT', url: 'https://github.com/npm/npm.git'},
    };

    plugin.addDependency(pkg);

    expect(plugin._dependencies.foo).toBeDefined();
    expect(plugin._dependencies.foo).toEqual(jasmine.objectContaining({
      author: {
        name: 'Mickael Jeanroy',
        url: 'https://mjeanroy.com',
        email: 'mickael.jeanroy@gmail.com',
      },
    }));
  });

  it('should add dependency and parse contributors field as a string', () => {
    const plugin = new LicensePlugin();
    const pkg = {
      name: 'foo',
      version: '0.0.0',
      author: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      contributors: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      description: 'Fake Description',
      main: 'src/index.js',
      license: 'MIT',
      homepage: 'https://www.google.fr',
      private: true,
      repository: {type: 'GIT', url: 'https://github.com/npm/npm.git'},
    };

    plugin.addDependency(pkg);

    expect(plugin._dependencies.foo).toBeDefined();
    expect(plugin._dependencies.foo).toEqual(jasmine.objectContaining({
      contributors: [{
        name: 'Mickael Jeanroy',
        url: 'https://mjeanroy.com',
        email: 'mickael.jeanroy@gmail.com',
      }],
    }));
  });

  it('should add dependency and parse contributors field', () => {
    const plugin = new LicensePlugin();
    const pkg = {
      name: 'foo',
      version: '0.0.0',
      author: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      contributors: [
        'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
        {name: 'John Doe', email: 'johndoe@doe.com'},
      ],
      description: 'Fake Description',
      main: 'src/index.js',
      license: 'MIT',
      homepage: 'https://www.google.fr',
      private: true,
      repository: {type: 'GIT', url: 'https://github.com/npm/npm.git'},
    };

    plugin.addDependency(pkg);

    expect(plugin._dependencies.foo).toBeDefined();
    expect(plugin._dependencies.foo).toEqual(jasmine.objectContaining({
      contributors: [
        {name: 'Mickael Jeanroy', url: 'https://mjeanroy.com', email: 'mickael.jeanroy@gmail.com'},
        {name: 'John Doe', email: 'johndoe@doe.com'},
      ],
    }));
  });

  it('should add dependency and parse licenses field', () => {
    const plugin = new LicensePlugin();
    const pkg = {
      name: 'foo',
      version: '0.0.0',
      author: 'Mickael Jeanroy <mickael.jeanroy@gmail.com> (https://mjeanroy.com)',
      description: 'Fake Description',
      main: 'src/index.js',
      licenses: [
        {type: 'MIT', url: 'http://www.opensource.org/licenses/mit-license.php'},
        {type: 'Apache-2.0', url: 'http://opensource.org/licenses/apache2.0.php'},
      ],
      homepage: 'https://www.google.fr',
      private: true,
      repository: {type: 'GIT', url: 'https://github.com/npm/npm.git'},
    };

    plugin.addDependency(pkg);

    expect(plugin._dependencies.foo).toBeDefined();
    expect(plugin._dependencies.foo.licenses).not.toBeDefined();
    expect(plugin._dependencies.foo).toEqual(jasmine.objectContaining({
      license: '(MIT OR Apache-2.0)',
    }));
  });

  it('should not add dependency twice', () => {
    const plugin = new LicensePlugin();
    const pkg = {
      name: 'foo',
      version: '0.0.0',
      author: {name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'},
      contributors: [{name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'}],
      description: 'Fake Description',
      main: 'src/index.js',
      license: 'MIT',
      homepage: 'https://www.google.fr',
      private: true,
      repository: {type: 'GIT', url: 'https://github.com/npm/npm.git'},
    };

    plugin.addDependency(pkg);

    expect(plugin._dependencies.foo).toBeDefined();
    expect(plugin._dependencies.foo).not.toBe(pkg);
    expect(plugin._dependencies).toEqual({
      foo: {
        name: 'foo',
        version: '0.0.0',
        author: {name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'},
        contributors: [{name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'}],
        description: 'Fake Description',
        license: 'MIT',
        homepage: 'https://www.google.fr',
        private: true,
        repository: {type: 'GIT', url: 'https://github.com/npm/npm.git'},
      },
    });

    // Try to add the same pkg id

    plugin.addDependency(pkg);

    expect(plugin._dependencies).toEqual({
      foo: {
        name: 'foo',
        version: '0.0.0',
        author: {name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'},
        contributors: [{name: 'Mickael Jeanroy', email: 'mickael.jeanroy@gmail.com'}],
        description: 'Fake Description',
        license: 'MIT',
        homepage: 'https://www.google.fr',
        private: true,
        repository: {type: 'GIT', url: 'https://github.com/npm/npm.git'},
      },
    });
  });

  it('should prepend banner to bundle', () => {
    const instance = new LicensePlugin({
      file: path.join(__dirname, 'fixtures', 'banner.js'),
    });

    const code = 'var foo = 0;';

    const result = instance.transformBundle(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(
      `/**\n` +
      ` * Test banner.\n` +
      ` *\n` +
      ` * With a second line.\n` +
      ` */\n` +
      `\n` +
      `${code}`
    );
  });

  it('should prepend default LICENSE file banner to bundle', () => {
    const instance = new LicensePlugin();

    const code = 'var foo = 0;';

    const result = instance.transformBundle(code);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.code).toContain('The MIT License (MIT)');
  });

  it('should not fail if banner file does not exist', () => {
    const instance = new LicensePlugin({
      file: path.join(__dirname, 'fixtures', 'dummy'),
    });

    const code = 'var foo = 0;';

    const result = instance.transformBundle(code);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.code).toBe(code);
  });

  it('should prepend banner and create block comment', () => {
    const instance = new LicensePlugin({
      file: path.join(__dirname, 'fixtures', 'banner.txt'),
    });

    const code = 'var foo = 0;';

    const result = instance.transformBundle(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(
      `/**\n` +
      ` * Test banner.\n` +
      ` *\n` +
      ` * With a second line.\n` +
      ` */\n` +
      `\n` +
      `${code}`
    );
  });

  it('should prepend banner to bundle and create sourceMap', () => {
    const instance = new LicensePlugin({
      file: path.join(__dirname, 'fixtures', 'banner.js'),
    });

    const code = 'var foo = 0;';

    const result = instance.transformBundle(code);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).toBeDefined();
  });

  it('should prepend banner to bundle and do not create sourceMap', () => {
    const instance = new LicensePlugin({
      sourceMap: false,
      file: path.join(__dirname, 'fixtures', 'banner.js'),
    });

    const code = 'var foo = 0;';

    const result = instance.transformBundle(code);

    expect(result).toBeDefined();
    expect(result.code).toBeDefined();
    expect(result.map).not.toBeDefined();
  });

  it('should prepend banner and replace moment variables', () => {
    const instance = new LicensePlugin({
      file: path.join(__dirname, 'fixtures', 'banner-with-moment.js'),
    });

    const code = 'var foo = 0;';

    const result = instance.transformBundle(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(
      `/**\n` +
      ` * Date: ${moment().format('YYYY-MM-DD')}\n` +
      ` */\n` +
      `\n` +
      `var foo = 0;`
    );
  });

  it('should prepend banner and replace package variables', () => {
    const instance = new LicensePlugin({
      file: path.join(__dirname, 'fixtures', 'banner-with-pkg.js'),
    });

    const code = 'var foo = 0;';

    const result = instance.transformBundle(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(
      `/**\n` +
      ` * Name: rollup-plugin-license\n` +
      ` */\n` +
      `\n` +
      `var foo = 0;`
    );
  });

  it('should prepend banner and replace dependencies placeholders', () => {
    const instance = new LicensePlugin({
      file: path.join(__dirname, 'fixtures', 'banner-with-dependencies.js'),
    });

    // Load a dependency
    instance.load(path.join(__dirname, 'fixtures', 'fake-package', 'src', 'index.js'));

    const code = 'var foo = 0;';
    const result = instance.transformBundle(code);

    expect(result).toBeDefined();
    expect(result.code).toEqual(
      `/**\n` +
      ` * Name: rollup-plugin-license\n` +
      ` *\n` +
      ` * Dependencies:\n` +
      ` * \n` +
      ` *   fake-package -- MIT\n` +
      ` * \n` +
      ` */\n` +
      `\n` +
      `var foo = 0;`
    );
  });

  it('should display single dependency', (done) => {
    const file = path.join(tmpDir.name, 'third-party.txt');
    const instance = new LicensePlugin({
      thirdParty: {
        output: file,
      },
    });

    instance._dependencies.foo = {
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    };

    const result = instance.ongenerate(false);

    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      const txt = content.toString();
      expect(txt).toBeDefined();
      expect(txt).toEqual(
        `Name: foo\n` +
        `Version: 1.0.0\n` +
        `License: MIT\n` +
        `Private: false\n` +
        `Description: Foo Package\n` +
        `Author: Mickael Jeanroy <mickael.jeanroy@gmail.com>`
      );

      done();
    });
  });

  it('should display list of dependencies', (done) => {
    const file = path.join(tmpDir.name, 'third-party.txt');
    const instance = new LicensePlugin({
      thirdParty: {
        output: file,
      },
    });

    instance._dependencies.foo = {
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    };

    instance._dependencies.bar = {
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'Apache 2.0',
      private: false,
    };

    const result = instance.ongenerate(false);

    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      const txt = content.toString();
      expect(txt).toBeDefined();
      expect(txt).toEqual(
        `Name: foo\n` +
        `Version: 1.0.0\n` +
        `License: MIT\n` +
        `Private: false\n` +
        `Description: Foo Package\n` +
        `Author: Mickael Jeanroy <mickael.jeanroy@gmail.com>\n` +
        `\n` +
        `---\n` +
        `\n` +
        `Name: bar\n` +
        `Version: 2.0.0\n` +
        `License: Apache 2.0\n` +
        `Private: false\n` +
        `Description: Bar Package`
      );

      done();
    });
  });

  it('should not display private dependencies by default', (done) => {
    const file = path.join(tmpDir.name, 'third-party.txt');
    const instance = new LicensePlugin({
      thirdParty: {
        output: file,
      },
    });

    instance._dependencies.foo = {
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    };

    instance._dependencies.bar = {
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'Apache 2.0',
      private: true,
    };

    const result = instance.ongenerate(false);

    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      const txt = content.toString();
      expect(txt).toBeDefined();
      expect(txt).toEqual(
        `Name: foo\n` +
        `Version: 1.0.0\n` +
        `License: MIT\n` +
        `Private: false\n` +
        `Description: Foo Package\n` +
        `Author: Mickael Jeanroy <mickael.jeanroy@gmail.com>`
      );

      done();
    });
  });

  it('should display private dependencies if enabled', (done) => {
    const file = path.join(tmpDir.name, 'third-party.txt');
    const instance = new LicensePlugin({
      thirdParty: {
        output: file,
        includePrivate: true,
      },
    });

    instance._dependencies.foo = {
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    };

    instance._dependencies.bar = {
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'Apache 2.0',
      private: true,
    };

    const result = instance.ongenerate(false);

    expect(result).not.toBeDefined();

    fs.readFile(file, 'utf-8', (err, content) => {
      if (err) {
        done.fail(err);
        return;
      }

      const txt = content.toString();
      expect(txt).toBeDefined();
      expect(txt).toEqual(
        `Name: foo\n` +
        `Version: 1.0.0\n` +
        `License: MIT\n` +
        `Private: false\n` +
        `Description: Foo Package\n` +
        `Author: Mickael Jeanroy <mickael.jeanroy@gmail.com>\n` +
        `\n` +
        `---\n` +
        `\n` +
        `Name: bar\n` +
        `Version: 2.0.0\n` +
        `License: Apache 2.0\n` +
        `Private: true\n` +
        `Description: Bar Package`
      );

      done();
    });
  });

  it('should not try to display dependencies without output file', () => {
    const instance = new LicensePlugin();

    instance._dependencies.foo = {
      name: 'foo',
      version: '1.0.0',
      description: 'Foo Package',
      license: 'MIT',
      private: false,
      author: {
        name: 'Mickael Jeanroy',
        email: 'mickael.jeanroy@gmail.com',
      },
    };

    instance._dependencies.bar = {
      name: 'bar',
      version: '2.0.0',
      description: 'Bar Package',
      license: 'Apache 2.0',
      private: true,
    };

    spyOn(fs, 'writeFileSync').and.callThrough();

    const result = instance.ongenerate(false);

    expect(result).not.toBeDefined();
    expect(fs.writeFileSync).not.toHaveBeenCalled();
  });
});
