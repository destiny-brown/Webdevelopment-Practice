// ======== Customize / Save toggle with eye icons + drag-and-drop ========

// Basic DOM helpers
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const btn = $('#customizeBtn');
const container = $('#container');

let customizing = false;   // whether we're in customization mode
let dragSrc = null;        // currently dragged block
let lastHover = null;      // last droppable block highlighted

// -------- Enter customization: show all, add dashed red border + eye, enable drag --------
function enterCustomize() {
    customizing = true;
    btn.textContent = 'Save';

    // Add window ESC listener ONCE
    window.addEventListener('keydown', onKeyDown);

    $$('.fin-block', container).forEach(block => {
        // capture intended visibility BEFORE removing .invisible
        const initiallyVisible = !block.classList.contains('invisible');
        block.dataset.intendedVisible = initiallyVisible ? 'true' : 'false';

        // visually show all while customizing
        block.classList.add('editing');
        block.classList.remove('invisible');

        // add eye icon
        addEyeButton(block);

        // enable DnD
        block.setAttribute('draggable', 'true');
        block.addEventListener('dragstart', onDragStart);
        block.addEventListener('dragover', onDragOver);
        block.addEventListener('drop', onDrop);
        block.addEventListener('dragleave', onDragLeave);
        block.addEventListener('dragenter', onDragEnter);
        block.addEventListener('dragend', onDragEnd);
    });
}

// -------- Exit customization: PUT visible list → restore normal mode --------
function exitCustomize() {
    customizing = false;

    // Collect visible blocks in current DOM order (only those marked intended-visible)
    const visibleIds = $$('.fin-block', container)
        .filter(b => b.dataset.intendedVisible === 'true')
        .map(b => parseInt(b.dataset.blockId, 10));

    // One place that disables DnD, removes eye icons & borders, hides hidden, resets label
    const cleanupUI = () => {
        // remove global ESC listener ONCE
        window.removeEventListener('keydown', onKeyDown);

        $$('.fin-block', container).forEach(block => {
            // remove editing visuals
            block.classList.remove('editing');

            const eye = block.querySelector('.eye-btn');
            if (eye) eye.remove();

            // disable DnD + remove all drag listeners
            block.removeAttribute('draggable');
            block.removeEventListener('dragstart', onDragStart);
            block.removeEventListener('dragover', onDragOver);
            block.removeEventListener('drop', onDrop);
            block.removeEventListener('dragleave', onDragLeave);
            block.removeEventListener('dragenter', onDragEnter);
            block.removeEventListener('dragend', onDragEnd);

            // clear inline border (return to default appearance)
            block.style.border = '';

            // show/hide by intended visibility
            const shouldShow = block.dataset.intendedVisible === 'true';
            block.classList.toggle('invisible', !shouldShow);

            // clear temp state
            delete block.dataset.intendedVisible;
        });

        // label back to Customize (consistent with your HTML)
        btn.textContent = 'Customize';
    };

    // Do the visual/UI revert immediately
    cleanupUI();

    // Then fire-and-forget the PUT (log status; stay in normal mode even if server fails)
    savePrefs(visibleIds).catch(err => {
        console.error('PUT error:', err);
    });
}

// -------- Eye button (top-right): toggle visibility and move to begin/end --------
function addEyeButton(block) {
    const eye = document.createElement('button');
    eye.className = 'eye-btn';
    eye.type = 'button';

    const isVisible = block.dataset.intendedVisible === 'true';

    // Create the eye image
    const eyeImg = document.createElement('img');
    eyeImg.width = 20;
    eyeImg.height = 20;
    updateEyeImage(eyeImg, isVisible);

    eye.appendChild(eyeImg);
    eye.setAttribute('aria-label', isVisible ? 'Visible' : 'Hidden');

    eye.addEventListener('click', () => {
        const currentlyVisible = (block.dataset.intendedVisible === 'true');
        const nextVisible = !currentlyVisible;
        block.dataset.intendedVisible = nextVisible ? 'true' : 'false';

        // Update existing image instead of replacing it
        updateEyeImage(eyeImg, nextVisible);
        eye.setAttribute('aria-label', nextVisible ? 'Visible' : 'Hidden');

        // Move per spec:
        // - Visible → move to BEGINNING
        // - Hidden  → move to END
        if (nextVisible) {
            container.insertBefore(block, container.firstElementChild);
        } else {
            container.appendChild(block);
        }
    });

    block.appendChild(eye);
}

function updateEyeImage(imgElement, isVisible) {
    imgElement.src = isVisible ? 'images/eye-open.png' : 'images/eye-close.png';
    imgElement.alt = isVisible ? 'Visible' : 'Hidden';
}

// -------- Drag & drop handlers --------
function onDragStart(e) {
    dragSrc = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragSrc.dataset.blockId || '');
}

function onDragOver(e) {
    e.preventDefault(); // allow drop anywhere over the block
    const target = e.currentTarget;
    if (lastHover && lastHover !== target) {
        lastHover.style.border = '1px dashed red';
    }
    target.style.border = '5px solid pink';
    lastHover = target;
}

function onDragLeave(e) {
    // when leaving the droppable area, revert to dashed red
    e.currentTarget.style.border = '1px dashed red';
    if (lastHover === e.currentTarget) lastHover = null;
}

function onDrop(e) {
    e.preventDefault();
    const target = e.currentTarget;

    // Reset highlight on the drop target
    target.style.border = '1px dashed red';
    lastHover = null;

    if (dragSrc && dragSrc !== target) {
        const next = target.nextElementSibling;
        if (next) container.insertBefore(dragSrc, next);
        else container.appendChild(dragSrc);
    }

    dragSrc = null;
}

// when the dragged block enters a droppable, show pink border immediately
function onDragEnter(e) {
    if (!customizing) return;
    const target = e.currentTarget;
    e.preventDefault();
    if (lastHover && lastHover !== target) {
        lastHover.style.border = '1px dashed red';
    }
    target.style.border = '5px solid pink';
    lastHover = target;
}

// when dragging ends (drop or cancel), ensure UI is reset
function onDragEnd() {
    if (lastHover) {
        lastHover.style.border = '1px dashed red';
        lastHover = null;
    }
    $$('.fin-block', container).forEach(b => {
        if (b.classList.contains('editing')) b.style.border = '1px dashed red';
    });
    dragSrc = null;
}

// cancel current drag/highlight when user presses ESC (as per spec)
function onKeyDown(e) {
    if (!customizing) return;
    if (e.key === 'Escape') {
        $$('.fin-block', container).forEach(b => {
            if (b.classList.contains('editing')) b.style.border = '1px dashed red';
        });
        lastHover = null;
        dragSrc = null;
    }
}

// -------- PUT to server: send visible IDs in current order --------
async function savePrefs(visibleIds) {
    const res = await fetch('index.php', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visible: visibleIds })
    });

    // Log the returned status code (Part 4 requirement)
    console.log('[PUT /index.php] status =', res.status);

    if (res.status === 200) {
        const ct = (res.headers.get('Content-Type') || '');
        if (ct.includes('application/json')) {
            const j = await res.json();
            if (j.uid) {
                // server issued a NEW uid (invalid/expired cookie case) -> set 5-min cookie
                const expires = new Date(Date.now() + 300 * 1000).toUTCString();
                document.cookie = `uid=${j.uid}; expires=${expires}; path=/`;
            }
        }
        return; // success
    } else if (res.status === 400) {
        throw new Error('400 Bad Request: missing uid or preferences');
    } else {
        throw new Error('Server error while saving preferences');
    }
}

// -------- Toggle wiring --------
btn.addEventListener('click', () => {
    if (!customizing) enterCustomize();
    else exitCustomize();
});