package com.cookmate.dto;

public class ChallengeParticipationRequest {
    private String notes;

    public ChallengeParticipationRequest() {}

    public ChallengeParticipationRequest(String notes) {
        this.notes = notes;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
