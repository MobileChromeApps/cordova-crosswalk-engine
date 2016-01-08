#!/usr/bin/env node

module.exports = function(context) {

    var ConfigParser, XmlHelpers;
    try {
        // cordova-lib >= 5.3.4 doesn't contain ConfigParser and xml-helpers anymore
        ConfigParser = context.requireCordovaModule("cordova-common").ConfigParser;
        XmlHelpers = context.requireCordovaModule("cordova-common").xmlHelpers;
    } catch (e) {
        ConfigParser = context.requireCordovaModule("cordova-lib/src/configparser/ConfigParser");
        XmlHelpers = context.requireCordovaModule("cordova-lib/src/util/xml-helpers");
    }

    /** @external */
    var fs = context.requireCordovaModule('fs'),
        path = context.requireCordovaModule('path'),
        et = context.requireCordovaModule('elementtree');

    /** @defaults */
    var xwalkVariables = {},
        argumentsString = context.cmdLine,
        pluginConfigurationFile = path.join(context.opts.plugin.dir, 'plugin.xml'),
        androidPlatformDir = path.join(context.opts.projectRoot,
            'platforms', 'android'),
        projectConfigurationFile = path.join(context.opts.projectRoot,
            'config.xml'),
        projectManifestFile = path.join(androidPlatformDir,
            'AndroidManifest.xml');

    /** Init */
    var CordovaConfig = new ConfigParser(projectConfigurationFile);

    var addPermission = function() {
        var projectManifestXmlRoot = XmlHelpers.parseElementtreeSync(projectManifestFile);
        var child = et.XML('<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />');
        XmlHelpers.graftXML(projectManifestXmlRoot, [child], '/manifest');
        fs.writeFileSync(projectManifestFile, projectManifestXmlRoot.write({indent: 4}), 'utf-8');
    }

    var removePermission = function() {
        var projectManifestXmlRoot = XmlHelpers.parseElementtreeSync(projectManifestFile);
        var child = et.XML('<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />');
        XmlHelpers.pruneXML(projectManifestXmlRoot, [child], '/manifest');
        fs.writeFileSync(projectManifestFile, projectManifestXmlRoot.write({indent: 4}), 'utf-8');
    }

    var defaultPreferences = function() {
        var pluginPreferences = {};

        var pluginXmlRoot = XmlHelpers.parseElementtreeSync(pluginConfigurationFile),
            tagName = "preference",
            containerName = "config-file",
            targetPlatform = 'android',
            targetPlatformTag = pluginXmlRoot.find('./platform[@name="' + targetPlatform + '"]');

        var tagsInRoot = pluginXmlRoot.findall(tagName) || [],
            tagsInPlatform = targetPlatformTag ? targetPlatformTag.findall(tagName) : [],
            tagsInContainer = targetPlatformTag ? targetPlatformTag.findall(containerName) : [],
            tagsList = tagsInRoot.concat(tagsInContainer);

        // Parses <preference> tags within <config-file>-blocks
        tagsList.map(function(prefTag) {
            prefTag.getchildren().forEach(function(element) {
                if ((element.tag == 'preference') && (element.attrib['name']) && element.attrib['default']) {
                    pluginPreferences[element.attrib['name']] = element.attrib['default'];
                }
            });
        });

        return pluginPreferences;
    }

    /** The style of name align with config.xml */
    var setConfigPreference = function(name, value) {
        var trimName = name.replace('_', '');
        for (localName in xwalkVariables) {
            if (localName.toUpperCase() == trimName.toUpperCase()) {
                xwalkVariables[localName] = value;
            }
        }
    }

    /** Pase the cli command to get the specific preference*/
    var parseCliPreference = function() {
        var commandlineVariablesList = argumentsString.split('--variable');
        if (commandlineVariablesList) {
            commandlineVariablesList.forEach(function(element) {
                element = element.trim();
                if(element && element.indexOf('XWALK') == 0) {
                    var preference = element.split('=');
                    if (preference && preference.length == 2) {
                        setConfigPreference(preference[0], preference[1]);
                    }
                }
            });
        }
    }

    /** Add preference */
    this.addPreferences = function() {
        // Pick the xwalk variables with the cli preferences
        parseCliPreference();

        // Add the permission of writing external storage when using shared mode
        if (xwalkVariables['xwalkMode'] == 'shared') {
            addPermission();
        }
    }

    /** Remove preference*/
    this.removePreferences = function() {
        if (CordovaConfig.getGlobalPreference('xwalkMode') == 'shared') {
            // Add the permission of write_external_storage in shared mode
            removePermission();
        }
    }

    xwalkVariables = defaultPreferences();

};
