#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const childProcess = require('child_process')

const pify = require('pify')
const pick = require('es6-pick')
const findUp = require('find-up')
const findRequires = require('find-requires')
const loadJsonFile = require('load-json-file')
const builtinModules = require('builtin-modules')

const exec = pify(childProcess.exec)

const defaults = {
  extends: [],
  packageDir: 'packages/node_modules'
}

const updatePackages = (dir, packages, topPkg, rc) => {
  const picked = pick(topPkg, ...rc.extends)

  const updatePackage = ([json, main]) => {
    const dependencies = findRequires(main)
      .filter(dep => (
        dep !== json.name &&
        builtinModules.indexOf(dep) === -1 &&
        !dep.startsWith('./')
      ))
      .map(dep => {
        if (!rc.transformers) {
          return dep
        }
        return Object.keys(rc.transformers)
          .reduce((str, transformer) => {
            return require(transformer)(str, rc.transformers[transformer])
          }, dep)
      })
      .sort()
      .reduce((index, dep) => {
        if (topPkg.dependencies[dep]) {
          index[dep] = topPkg.dependencies[dep]
          return index
        }

        let name = dep
        if (rc.scope) {
          name = name.replace(`${rc.scope}/`, '')
        }
        if (packages.indexOf(name) !== -1) {
          index[dep] = topPkg.version
          return index
        }

        throw new Error(`Unknown dependency ${dep}`)
      }, {})

    return Object.assign({}, rc.template, picked, json, {
      version: topPkg.version,
      dependencies
    })
  }

  const promises = packages.map(pkg => {
    const pkgPath = path.join(dir, pkg, 'package.json')
    const inner = [
      loadJsonFile(pkgPath),
      pify(fs.readFile)(path.join(dir, pkg, 'index.js'))
    ]
    return Promise.all(inner)
      .then(updatePackage)
      .then(pkg => {
        const json = `${JSON.stringify(pkg, null, 2)}\n`
        return pify(fs.writeFile)(pkgPath, json, 'utf8')
      })
      .then(() => path.join(dir, pkg))
  })

  return Promise.all(promises)
}

const readPackages = rc => {
  const config = Object.assign({}, defaults, rc)
  let dir = config.packageDir
  if (config.scope) {
    dir = path.join(dir, config.scope)
  }
  return pify(fs.readdir)(dir)
    .then(packages => [dir, packages])
}

const publish = packages => {
  const promises = packages.map(pkg => {
    return exec(`cd ${pkg} && npm publish`)
      .then(res => console.log(res.replace(/\n$/, '')))
  })
  return Promise.all(promises)
}

const readAndUpdate = ([topPkg, rc]) => {
  return readPackages(rc)
    .then(([dir, packages]) => {
      if (!packages.length) {
        return Promise.resolve(`no packages found in ${dir}`)
      }
      return updatePackages(dir, packages, topPkg, rc)
    })
    .then(publish)
    .then(() => exec(`git checkout ${defaults.packageDir}`))
}

const promises = [
  findUp('package.json').then(pkg => loadJsonFile(pkg)),
  findUp('.allerc').then(rc => loadJsonFile(rc))
]

Promise.all(promises)
  .then(readAndUpdate)
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
