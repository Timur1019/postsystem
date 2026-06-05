package com.pos.service.email;

import com.pos.dto.email.EmailTemplateInfoResponse;
import com.pos.dto.email.EmailTemplatePreviewRequest;
import com.pos.dto.email.EmailTemplatePreviewResponse;
import com.pos.dto.email.SendBroadcastEmailRequest;
import com.pos.dto.email.SendBroadcastEmailResponse;

import java.util.List;

public interface PlatformEmailService {

    List<EmailTemplateInfoResponse> listTemplates();

    EmailTemplatePreviewResponse preview(EmailTemplatePreviewRequest request);

    SendBroadcastEmailResponse sendBroadcast(SendBroadcastEmailRequest request);
}
