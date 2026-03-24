package com.cookmate.dto;

public class ContentReportRequest {
    private String reason;

    public ContentReportRequest() {}

    public ContentReportRequest(String reason) {
        this.reason = reason;
    }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
