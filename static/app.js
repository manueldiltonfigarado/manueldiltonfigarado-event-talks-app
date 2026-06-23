document.addEventListener('DOMContentLoaded', () => {
    // State management
    let releaseNotes = []; // Flattened list of individual updates
    let selectedTypeFilter = 'all';
    let searchQuery = '';
    let selectedTextForTweet = '';

    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const refreshSpinner = document.getElementById('refresh-spinner');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const feedList = document.getElementById('feed-list');
    const loadingView = document.getElementById('loading-view');
    const errorView = document.getElementById('error-view');
    const errorMessage = document.getElementById('error-message');
    const retryBtn = document.getElementById('retry-btn');
    const emptyView = document.getElementById('empty-view');
    const searchInput = document.getElementById('search-input');
    const typeFilters = document.getElementById('type-filters');
    
    // Tweet elements
    const floatingTweetBtn = document.getElementById('floating-tweet-btn');
    const tweetModal = document.getElementById('tweet-modal');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelTweetBtn = document.getElementById('cancel-tweet-btn');
    const sendTweetBtn = document.getElementById('send-tweet-btn');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');

    // Fetch and parse the release notes
    async function fetchReleaseNotes() {
        showView('loading');
        refreshSpinner.classList.add('spinning');
        refreshBtn.disabled = true;

        try {
            const response = await fetch('/api/releases');
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            processFeedEntries(data.entries);
            renderFeed();
        } catch (error) {
            console.error('Error fetching release notes:', error);
            errorMessage.textContent = error.message || 'Failed to fetch release notes.';
            showView('error');
        } finally {
            refreshSpinner.classList.remove('spinning');
            refreshBtn.disabled = false;
        }
    }

    // Process entry HTML content into individual updates
    function processFeedEntries(entries) {
        const flattened = [];
        const parser = new DOMParser();

        entries.forEach(entry => {
            const doc = parser.parseFromString(entry.content, 'text/html');
            const children = Array.from(doc.body.children);
            
            let currentUpdate = null;
            
            children.forEach(child => {
                if (child.tagName === 'H3') {
                    if (currentUpdate) {
                        flattened.push(currentUpdate);
                    }
                    // Determine type normalized to standard filter options
                    const rawType = child.innerText.trim();
                    let type = 'General';
                    if (rawType.toLowerCase().includes('feature')) type = 'Feature';
                    else if (rawType.toLowerCase().includes('change')) type = 'Change';
                    else if (rawType.toLowerCase().includes('deprecat')) type = 'Deprecated';

                    currentUpdate = {
                        date: entry.title,
                        rawDate: entry.updated,
                        link: entry.link,
                        type: type,
                        typeName: rawType, // Store exact name e.g. "Feature", "Resolved Issues", etc.
                        htmlContent: '',
                        textContent: ''
                    };
                } else {
                    if (!currentUpdate) {
                        currentUpdate = {
                            date: entry.title,
                            rawDate: entry.updated,
                            link: entry.link,
                            type: 'General',
                            typeName: 'General',
                            htmlContent: '',
                            textContent: ''
                        };
                    }
                    currentUpdate.htmlContent += child.outerHTML;
                    currentUpdate.textContent += child.innerText + '\n';
                }
            });

            if (currentUpdate) {
                flattened.push(currentUpdate);
            }
        });

        // Clean textContent and filter empty entries
        releaseNotes = flattened.map((note, index) => {
            note.id = `note-${index}`;
            note.textContent = note.textContent.trim().replace(/\s+/g, ' ');
            return note;
        }).filter(note => note.htmlContent.trim().length > 0);
    }

    // Show appropriate view states
    function showView(view) {
        loadingView.classList.add('hidden');
        errorView.classList.add('hidden');
        emptyView.classList.add('hidden');
        feedList.classList.add('hidden');

        if (view === 'loading') {
            loadingView.classList.remove('hidden');
        } else if (view === 'error') {
            errorView.classList.remove('hidden');
        } else if (view === 'empty') {
            emptyView.classList.remove('hidden');
        } else if (view === 'feed') {
            feedList.classList.remove('hidden');
        }
    }

    // Render feed items based on filter and search
    function renderFeed() {
        const filtered = releaseNotes.filter(note => {
            const matchesType = selectedTypeFilter === 'all' || note.type === selectedTypeFilter;
            const matchesSearch = searchQuery === '' || 
                note.date.toLowerCase().includes(searchQuery) ||
                note.typeName.toLowerCase().includes(searchQuery) ||
                note.textContent.toLowerCase().includes(searchQuery);
            return matchesType && matchesSearch;
        });

        if (filtered.length === 0) {
            showView('empty');
            return;
        }

        feedList.innerHTML = '';
        filtered.forEach(note => {
            const card = document.createElement('div');
            card.className = `release-card`;
            card.id = note.id;
            
            // Set css custom property for left border coloring
            let typeColor = 'var(--color-general)';
            let badgeBg = 'rgba(139, 92, 246, 0.15)';
            let badgeColor = 'rgba(167, 139, 250, 1)';
            
            if (note.type === 'Feature') {
                typeColor = 'var(--color-feature)';
                badgeBg = 'rgba(16, 185, 129, 0.15)';
                badgeColor = 'rgba(52, 211, 153, 1)';
            } else if (note.type === 'Change') {
                typeColor = 'var(--color-change)';
                badgeBg = 'rgba(245, 158, 11, 0.15)';
                badgeColor = 'rgba(251, 191, 36, 1)';
            } else if (note.type === 'Deprecated') {
                typeColor = 'var(--color-deprecated)';
                badgeBg = 'rgba(239, 68, 68, 0.15)';
                badgeColor = 'rgba(248, 113, 113, 1)';
            }

            card.style.setProperty('--type-color', typeColor);
            card.style.setProperty('--badge-bg', badgeBg);
            card.style.setProperty('--badge-color', badgeColor);

            card.innerHTML = `
                <div class="card-header">
                    <div class="card-meta">
                        <span class="card-date"><i class="fa-regular fa-calendar-days"></i> ${note.date}</span>
                        <span class="card-type-badge">${note.typeName}</span>
                    </div>
                </div>
                <div class="card-content">
                    ${note.htmlContent}
                </div>
                <div class="card-actions">
                    <button class="btn btn-secondary copy-card-btn" data-id="${note.id}" title="Copy to clipboard">
                        <i class="fa-regular fa-copy"></i> Copy
                    </button>
                    <button class="btn btn-secondary tweet-card-btn" data-id="${note.id}">
                        <i class="fa-brands fa-x-twitter"></i> Tweet
                    </button>
                </div>
            `;
            feedList.appendChild(card);
        });

        // Add event listeners to the newly rendered buttons
        document.querySelectorAll('.tweet-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteId = e.currentTarget.getAttribute('data-id');
                const note = releaseNotes.find(n => n.id === noteId);
                if (note) {
                    composeTweetFromNote(note);
                }
            });
        });

        // Copy to clipboard listeners
        document.querySelectorAll('.copy-card-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const noteId = e.currentTarget.getAttribute('data-id');
                const note = releaseNotes.find(n => n.id === noteId);
                if (!note) return;

                const textToCopy = `BigQuery Update — ${note.date} (${note.typeName})\n\n${note.textContent}\n\nMore details: ${note.link}`;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const icon = btn.querySelector('i');
                    const original = btn.innerHTML;
                    btn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
                    btn.classList.add('btn-copied');
                    setTimeout(() => {
                        btn.innerHTML = original;
                        btn.classList.remove('btn-copied');
                    }, 2000);
                }).catch(() => {
                    alert('Failed to copy to clipboard.');
                });
            });
        });

        showView('feed');
    }

    // Set up Tweet modal contents from standard note card
    function composeTweetFromNote(note) {
        const header = `BigQuery Update [${note.date}] (${note.typeName}):\n`;
        const footer = `\nRead details: ${note.link}`;
        const maxDescLength = 280 - header.length - footer.length - 5; // buffer
        
        let desc = note.textContent;
        if (desc.length > maxDescLength) {
            desc = desc.substring(0, maxDescLength) + '...';
        }

        openTweetModal(`${header}${desc}${footer}`);
    }

    // Setup Tweet Modal and display it
    function openTweetModal(text) {
        tweetTextarea.value = text;
        updateCharCounter();
        tweetModal.classList.remove('hidden');
        tweetTextarea.focus();
    }

    function updateCharCounter() {
        const length = tweetTextarea.value.length;
        charCounter.textContent = `${length} / 280`;
        if (length > 280) {
            charCounter.style.color = 'var(--color-deprecated)';
            sendTweetBtn.disabled = true;
        } else {
            charCounter.style.color = 'var(--text-muted)';
            sendTweetBtn.disabled = false;
        }
    }

    // Text Selection Event Listener for "Highlight to Tweet"
    document.addEventListener('selectionchange', () => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();
        
        if (selectedText.length > 0 && isSelectionInsideFeed(selection.anchorNode)) {
            selectedTextForTweet = selectedText;
            
            // Position the floating button near selection
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            
            floatingTweetBtn.style.top = `${rect.top + window.scrollY - 45}px`;
            floatingTweetBtn.style.left = `${rect.left + window.scrollX + (rect.width / 2) - 65}px`;
            floatingTweetBtn.classList.remove('hidden');
        } else {
            // Give a tiny timeout so button click registers before it hides
            setTimeout(() => {
                if (window.getSelection().toString().trim() === '') {
                    floatingTweetBtn.classList.add('hidden');
                }
            }, 100);
        }
    });

    // Helper to verify if selection is inside a release note card
    function isSelectionInsideFeed(node) {
        if (!node) return false;
        let parent = node.parentNode;
        while (parent && parent !== document.body) {
            if (parent.classList && (parent.classList.contains('card-content') || parent.classList.contains('release-card'))) {
                return true;
            }
            parent = parent.parentNode;
        }
        return false;
    }

    // Interactive event listeners
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);

    // Search query listener
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        renderFeed();
    });

    // Sidebar filter selection
    typeFilters.addEventListener('click', (e) => {
        const item = e.target.closest('.filter-item');
        if (!item) return;

        document.querySelectorAll('.filter-item').forEach(el => el.classList.remove('checked'));
        item.classList.add('checked');
        
        selectedTypeFilter = item.getAttribute('data-type');
        renderFeed();
    });

    // Floating Tweet Button click handler
    floatingTweetBtn.addEventListener('mousedown', (e) => {
        // Prevent selection from clearing out immediately
        e.preventDefault();
        
        const selection = window.getSelection();
        // Try to get BQ Link if possible
        let link = 'https://docs.cloud.google.com/bigquery/docs/release-notes';
        let parent = selection.anchorNode.parentNode;
        while (parent && parent !== document.body) {
            if (parent.classList && parent.classList.contains('release-card')) {
                const tweetBtn = parent.querySelector('.tweet-card-btn');
                if (tweetBtn) {
                    const noteId = tweetBtn.getAttribute('data-id');
                    const note = releaseNotes.find(n => n.id === noteId);
                    if (note) link = note.link;
                }
                break;
            }
            parent = parent.parentNode;
        }

        const header = `BigQuery Release Notes:\n"`;
        const footer = `"\nMore details: ${link}`;
        const maxSelectedLength = 280 - header.length - footer.length;
        
        let text = selectedTextForTweet;
        if (text.length > maxSelectedLength) {
            text = text.substring(0, maxSelectedLength - 3) + '...';
        }
        
        openTweetModal(`${header}${text}${footer}`);
        floatingTweetBtn.classList.add('hidden');
    });

    // Modal Action listeners
    closeModalBtn.addEventListener('click', () => tweetModal.classList.add('hidden'));
    cancelTweetBtn.addEventListener('click', () => tweetModal.classList.add('hidden'));
    
    tweetTextarea.addEventListener('input', updateCharCounter);

    sendTweetBtn.addEventListener('click', () => {
        const text = encodeURIComponent(tweetTextarea.value);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
        tweetModal.classList.add('hidden');
    });

    // Export CSV functionality
    function exportToCSV() {
        const filtered = releaseNotes.filter(note => {
            const matchesType = selectedTypeFilter === 'all' || note.type === selectedTypeFilter;
            const matchesSearch = searchQuery === '' ||
                note.date.toLowerCase().includes(searchQuery) ||
                note.typeName.toLowerCase().includes(searchQuery) ||
                note.textContent.toLowerCase().includes(searchQuery);
            return matchesType && matchesSearch;
        });

        if (filtered.length === 0) {
            alert('No notes to export. Try adjusting your filters.');
            return;
        }

        const escapeCSV = (str) => `"${String(str).replace(/"/g, '""')}"`;

        const headers = ['Date', 'Type', 'Summary', 'Link'];
        const rows = filtered.map(note => [
            escapeCSV(note.date),
            escapeCSV(note.typeName),
            escapeCSV(note.textContent),
            escapeCSV(note.link)
        ].join(','));

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `bigquery-release-notes-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportCsvBtn.addEventListener('click', exportToCSV);

    // Initial load
    fetchReleaseNotes();
});
