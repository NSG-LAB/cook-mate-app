package com.cookmate.dto;

import java.util.List;

public class SocialPageResponse<T> {
    private List<T> items;
    private Integer page;
    private int size;
    private long totalElements;
    private boolean hasNext;
    private Long nextCursor;

    public SocialPageResponse() {}

    public SocialPageResponse(List<T> items, Integer page, int size, long totalElements, boolean hasNext, Long nextCursor) {
        this.items = items;
        this.page = page;
        this.size = size;
        this.totalElements = totalElements;
        this.hasNext = hasNext;
        this.nextCursor = nextCursor;
    }

    public List<T> getItems() { return items; }
    public void setItems(List<T> items) { this.items = items; }

    public Integer getPage() { return page; }
    public void setPage(Integer page) { this.page = page; }

    public int getSize() { return size; }
    public void setSize(int size) { this.size = size; }

    public long getTotalElements() { return totalElements; }
    public void setTotalElements(long totalElements) { this.totalElements = totalElements; }

    public boolean isHasNext() { return hasNext; }
    public void setHasNext(boolean hasNext) { this.hasNext = hasNext; }

    public Long getNextCursor() { return nextCursor; }
    public void setNextCursor(Long nextCursor) { this.nextCursor = nextCursor; }
}