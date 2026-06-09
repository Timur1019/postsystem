const { dialog } = require('electron');
const { loadConfig } = require('../core/config.cjs');
const { httpGet } = require('../core/http-client.cjs');
const { startEmbeddedUi, resolveWebDist } = require('../network/embedded-server.cjs');
const { probeApiHealth } = require('../network/api-health.cjs');
const {
  configureServerInteractive,
  hasUserServerConfig,
} = require('../window/cashier-session.cjs');
const state = require('./state.cjs');

async function waitForServices() {
  let config = state.getConfig();
  if (config.useEmbedded) {
    try {
      const url = await startEmbeddedUi({
        port: config.embeddedPort,
        backendOrigin: config.backendOrigin,
      });
      if (!url) {
        return {
          ok: false,
          message:
            'В установке нет встроенного интерфейса (web-dist).\n' +
            'Переустановите кассу с сайта /install или укажите сервер в «Настройка сервера».',
        };
      }
      config.cashierUrl = url.replace(/\/$/, '');
      state.setConfig(config);
    } catch (err) {
      return {
        ok: false,
        message: `Не удалось запустить интерфейс кассы:\n${err.message}`,
      };
    }
  }

  const frontendOk = await httpGet(`${config.cashierUrl}/`);
  if (!frontendOk) {
    const hint = config.useRemoteUi
      ? `Проверьте, что на сервере запущен веб (порт ${config.webPort || '80'}) и файрвол его пропускает.`
      : '';
    return {
      ok: false,
      message: `Интерфейс кассы недоступен:\n${config.cashierUrl}\n\n${hint}`.trim(),
    };
  }

  let apiProbe = await probeApiHealth(config);
  if (!apiProbe.ok && !config.useEmbedded) {
    try {
      await configureServerInteractive();
      config = loadConfig();
      state.setConfig(config);
      if (config.useEmbedded) {
        const url = await startEmbeddedUi({
          port: config.embeddedPort,
          backendOrigin: config.backendOrigin,
        });
        if (url) {
          config.cashierUrl = url.replace(/\/$/, '');
          state.setConfig(config);
        }
      }
      apiProbe = await probeApiHealth(config);
    } catch {
      apiProbe = { ok: false, tried: apiProbe.tried || [] };
    }
  }

  if (!apiProbe.ok) {
    if (config.useEmbedded) {
      return { ok: true, offline: true };
    }
    const tried = (apiProbe.tried || []).slice(0, 4).join('\n');
    return {
      ok: false,
      message:
        `Сервер Aurent не отвечает.\n\n` +
        `Проверялись адреса:\n${tried}\n\n` +
        'Что сделать:\n' +
        '• Укажите IP сервера без http://\n' +
        '• HTTPS (aurent.uz): порт **443**, HTTP — **8081** (не 80)\n' +
        '• В браузере на этом ПК откройте:\n' +
        `  https://ВАШ_ДОМЕН/api/v1/actuator/health\n` +
        '  Должно быть: {"status":"UP"}\n' +
        '• На сервере: bash deploy/git-update.sh',
    };
  }

  return { ok: true };
}

async function ensureInitialServerConfig() {
  if (!hasUserServerConfig()) {
    try {
      await configureServerInteractive();
    } catch {
      return false;
    }
  }
  return true;
}

async function handleStartupHealthFailure(check) {
  const config = state.getConfig();
  const { logStartup } = require('../core/startup-log.cjs');
  logStartup('health_failed', { message: check.message });
  const hasEmbeddedUi = Boolean(config?.useEmbedded || resolveWebDist());
  const buttons = hasEmbeddedUi
    ? ['Настроить сервер', 'Открыть кассу офлайн', 'Закрыть']
    : ['Настроить сервер', 'Закрыть'];
  const retry = dialog.showMessageBoxSync({
    type: 'error',
    title: 'Aurent — Касса',
    message: 'Не удалось подключиться к серверу',
    detail: `${check.message}\n\nПроверьте интернет и порт 8081 (или 443 для HTTPS).${
      hasEmbeddedUi ? '\n\nМожно открыть кассу в офлайн-режиме, если каталог уже был загружен ранее.' : ''
    }`,
    buttons,
    defaultId: hasEmbeddedUi ? 1 : 0,
    cancelId: buttons.length - 1,
  });
  if (retry === 0) {
    try {
      await configureServerInteractive();
      const next = loadConfig();
      state.setConfig(next);
      return waitForServices();
    } catch {
      return { ok: false, message: check.message };
    }
  }
  if (hasEmbeddedUi && retry === 1) {
    logStartup('health_bypass_offline');
    if (config.useEmbedded) {
      try {
        const url = await startEmbeddedUi({
          port: config.embeddedPort,
          backendOrigin: config.backendOrigin,
        });
        if (url) {
          config.cashierUrl = url.replace(/\/$/, '');
          state.setConfig(config);
        }
      } catch {
        /* UI may still load from prior session */
      }
    }
    return { ok: true, offline: true };
  }
  return check;
}

module.exports = {
  waitForServices,
  ensureInitialServerConfig,
  handleStartupHealthFailure,
};
