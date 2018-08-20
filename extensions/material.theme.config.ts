import {
  workspace as Workspace,
  commands as Commands,
  ExtensionContext
} from 'vscode';

import * as ThemeCommands from './commands';
import {setCustomSetting} from './helpers/settings';
import {onChangeConfiguration} from './helpers/configuration-change';
import {changelogMessage, installationMessage} from './helpers/messages';
import checkInstallation from './helpers/check-installation';
import writeChangelog from './helpers/write-changelog';
import {SettingsWebview} from '../src/webviews/Settings';

export async function activate(context: ExtensionContext) {
  const config = Workspace.getConfiguration();
  const installationType = checkInstallation();
  const settingsView = new SettingsWebview(context);

  writeChangelog();

  // Listen on set theme: when the theme is Material Theme, just adjust icon and accent.
  Workspace.onDidChangeConfiguration(onChangeConfiguration);

  // Delete old configuration, must remove with next major release
  if (config.has('materialTheme.cache.workbench')) {
    config.update('materialTheme.cache.workbench', undefined, true);
  }

  if (installationType.isFirstInstall) {
    const enableAutoApply = await installationMessage();
    await setCustomSetting('autoApplyIcons', enableAutoApply);
    // Set true always on new installation
    await setCustomSetting('showReloadNotification', true);
  }

  const shouldShowChangelog = (installationType.isFirstInstall || installationType.isUpdate) && await changelogMessage();
  if (shouldShowChangelog) {
    ThemeCommands.showChangelog();
  }

  // Registering commands
  Commands.registerCommand('materialTheme.setAccent', async () => {
    const wasSet = await ThemeCommands.accentsSetter();
    handleAutoapply(wasSet);
  });
  Commands.registerCommand('materialTheme.fixIcons', () => ThemeCommands.fixIcons());
  Commands.registerCommand('materialTheme.toggleApplyIcons', () => ThemeCommands.toggleApplyIcons());
  Commands.registerCommand('materialTheme.showChangelog', () => ThemeCommands.showChangelog());

  Commands.registerCommand('materialTheme.showSettingsEditor', () => settingsView.show());
}
