package com.pos.service.ai.impl;

import org.springframework.util.StringUtils;

final class AiAssistantOfflineReply {

    private AiAssistantOfflineReply() {
    }

    static boolean isSimpleGreeting(String question) {
        if (!StringUtils.hasText(question)) {
            return false;
        }
        String q = question.toLowerCase().trim();
        if (q.length() > 80) {
            return false;
        }
        return q.equals("привет") || q.equals("здравствуйте") || q.equals("салам") || q.equals("hello")
                || q.equals("hi") || q.equals("как дела") || q.startsWith("привет ") || q.startsWith("hello ");
    }

    static String notConfigured(String language) {
        if ("en".equals(language)) {
            return """
                    AI assistant is not configured on the server.
                    Ask an administrator to set AI_ASSISTANT_ENABLED=true and AI_ASSISTANT_API_KEY in .env, then restart the backend container.
                    """.trim();
        }
        if ("uz".equals(language)) {
            return """
                    Serverda AI yordamchi sozlanmagan.
                    Administrator .env faylida AI_ASSISTANT_ENABLED=true va AI_ASSISTANT_API_KEY ni belgilab, backend konteynerini qayta ishga tushirishi kerak.
                    """.trim();
        }
        return """
                ИИ-ассистент на сервере не настроен.
                Администратору: в файле .env укажите AI_ASSISTANT_ENABLED=true и AI_ASSISTANT_API_KEY (ключ DeepSeek), затем перезапустите backend:
                docker compose -f docker-compose.prod.yml up -d --build backend
                """.trim();
    }

    static String greetingWithoutLlm(String language) {
        if ("en".equals(language)) {
            return "Hello! I'm your business assistant. The language model isn't connected yet — ask your admin to set AI_ASSISTANT_API_KEY. "
                    + "I can still show analytics from the system if you ask a specific question.";
        }
        if ("uz".equals(language)) {
            return "Salom! Men biznes yordamchisiman. Til modeli hali ulanmagan — administrator AI_ASSISTANT_API_KEY ni sozlashi kerak. "
                    + "Aniq savol bersangiz, tizimdan qisqa tahlil ko'rsataman.";
        }
        return "Привет! Я помощник директора по данным POS. Языковая модель пока не подключена — попросите администратора добавить AI_ASSISTANT_API_KEY в .env на сервере. "
                + "Могу кратко ответить по цифрам из системы, если зададите конкретный вопрос.";
    }

    static String llmFailed(String language, String dataBrief, String reason) {
        String hint = StringUtils.hasText(reason) ? reason : "";
        if ("en".equals(language)) {
            return "Could not reach the language model" + (hint.isEmpty() ? "" : " (" + hint + ")")
                    + ". Snapshot from system data:\n\n" + dataBrief;
        }
        if ("uz".equals(language)) {
            return "Til modeliga ulanib bo'lmadi" + (hint.isEmpty() ? "" : " (" + hint + ")")
                    + ". Tizim ma'lumotlari:\n\n" + dataBrief;
        }
        return "Сейчас не удалось связаться с языковой моделью"
                + (hint.isEmpty() ? "" : " (" + hint + ")")
                + ". Краткая сводка из данных системы:\n\n" + dataBrief;
    }
}
