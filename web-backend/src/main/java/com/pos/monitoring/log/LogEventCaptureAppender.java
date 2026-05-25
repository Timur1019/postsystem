package com.pos.monitoring.log;

import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.ThrowableProxyUtil;
import ch.qos.logback.core.AppenderBase;

import java.time.Instant;

/**
 * Logback appender — складывает каждое событие в {@link LogEventBuffer}.
 * Фильтр уровня (WARN/ERROR) выставляется в logback-spring.xml.
 */
public class LogEventCaptureAppender extends AppenderBase<ILoggingEvent> {

    @Override
    protected void append(ILoggingEvent event) {
        if (event == null) return;
        String throwable = null;
        IThrowableProxy proxy = event.getThrowableProxy();
        if (proxy != null) {
            String dump = ThrowableProxyUtil.asString(proxy);
            throwable = dump.length() > 8_000 ? dump.substring(0, 8_000) + "…" : dump;
        }
        LogEventBuffer.getInstance().add(new LogEventBuffer.Entry(
            Instant.ofEpochMilli(event.getTimeStamp()),
            event.getLevel().toString(),
            event.getLoggerName(),
            event.getThreadName(),
            event.getFormattedMessage(),
            throwable
        ));
    }
}
