const SCROLL_ANIMATION_TRIGGER_CLASSNAME = 'scroll-trigger';
const SCROLL_ANIMATION_OFFSCREEN_CLASSNAME = 'scroll-trigger--offscreen';
const SCROLL_ZOOM_IN_TRIGGER_CLASSNAME = 'animate--zoom-in';
const SCROLL_ANIMATION_CANCEL_CLASSNAME = 'scroll-trigger--cancel';

// Scroll in animation logic
function onIntersection(elements, observer) {
  elements.forEach((element, index) => {
    if (element.isIntersecting) {
      const elementTarget = element.target;
      if (elementTarget.classList.contains(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME)) {
        elementTarget.classList.remove(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
        if (elementTarget.hasAttribute('data-cascade'))
          elementTarget.setAttribute('style', `--animation-order: ${index};`);
      }
      observer.unobserve(elementTarget);
    } else {
      element.target.classList.add(SCROLL_ANIMATION_OFFSCREEN_CLASSNAME);
      element.target.classList.remove(SCROLL_ANIMATION_CANCEL_CLASSNAME);
    }
  });
}

function initializeScrollAnimationTrigger(rootEl = document, isDesignModeEvent = false) {
  const animationTriggerElements = Array.from(rootEl.getElementsByClassName(SCROLL_ANIMATION_TRIGGER_CLASSNAME));
  if (animationTriggerElements.length === 0) return;

  if (isDesignModeEvent) {
    animationTriggerElements.forEach((element) => {
      element.classList.add('scroll-trigger--design-mode');
    });
    return;
  }

  const observer = new IntersectionObserver(onIntersection, {
    rootMargin: '0px 0px -50px 0px',
  });
  animationTriggerElements.forEach((element) => observer.observe(element));
}

// Zoom in animation logic
function initializeScrollZoomAnimationTrigger() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const animationTriggerElements = Array.from(document.getElementsByClassName(SCROLL_ZOOM_IN_TRIGGER_CLASSNAME));

  if (animationTriggerElements.length === 0) return;

  const scaleAmount = 0.2 / 100;

  animationTriggerElements.forEach((element) => {
    let elementIsVisible = false;
    const observer = new IntersectionObserver((elements) => {
      elements.forEach((entry) => {
        elementIsVisible = entry.isIntersecting;
      });
    });
    observer.observe(element);

    element.style.setProperty('--zoom-in-ratio', 1 + scaleAmount * percentageSeen(element));

    window.addEventListener(
      'scroll',
      throttle(() => {
        if (!elementIsVisible) return;

        element.style.setProperty('--zoom-in-ratio', 1 + scaleAmount * percentageSeen(element));
      }),
      { passive: true }
    );
  });
}

function percentageSeen(element) {
  const viewportHeight = window.innerHeight;
  const scrollY = window.scrollY;
  const elementPositionY = element.getBoundingClientRect().top + scrollY;
  const elementHeight = element.offsetHeight;

  if (elementPositionY > scrollY + viewportHeight) {
    // If we haven't reached the image yet
    return 0;
  } else if (elementPositionY + elementHeight < scrollY) {
    // If we've completely scrolled past the image
    return 100;
  }

  // When the image is in the viewport
  const distance = scrollY + viewportHeight - elementPositionY;
  let percentage = distance / ((viewportHeight + elementHeight) / 100);
  return Math.round(percentage);
}

window.addEventListener('DOMContentLoaded', () => {
  initializeScrollAnimationTrigger();
  initializeScrollZoomAnimationTrigger();
});

if (Shopify.designMode) {
  document.addEventListener('shopify:section:load', (event) => initializeScrollAnimationTrigger(event.target, true));
  document.addEventListener('shopify:section:reorder', () => initializeScrollAnimationTrigger(document, true));
}

/* zepto - 上传图片动画 */
/* --- Shopify 上传动画 (优雅闭环特效版) --- */
(function() {
    function handleFileUpload(input) {
        const container = input.closest('.pplrfileuploadbutton') || input.parentElement;
        if (!container) return;

        if (input.files && input.files[0]) {
            const fileName = input.files[0].name;

            // 清理旧状态
            const existingWidget = container.querySelector('.custom-upload-widget');
            if (existingWidget) existingWidget.remove();

            // 创建 DOM (删除了对勾图标)
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = `
                <div class="custom-upload-widget">
                    <div class="progress-ring-container">
                        <svg class="progress-ring" width="28" height="28">
                           <circle class="progress-ring__circle" 
                                   stroke-width="3" 
                                   fill="transparent" 
                                   r="12" cx="14" cy="14"
                                   stroke-linecap="round" 
                                   style="stroke-dasharray: 75.4; stroke-dashoffset: 75.4;" />
                        </svg>
                    </div>
                    <div class="upload-filename" title="${fileName}">${fileName}</div>
                </div>
            `;
            
            const widgetNode = tempDiv.firstElementChild;
            container.appendChild(widgetNode);
            
            // 强制容器样式
            container.style.display = 'flex';
            container.style.justifyContent = 'flex-start';
            container.style.alignItems = 'center';

            // 开始动画
            simulateUploadProgress(widgetNode);
        }
    }

    // 动画函数 (1秒完成)
    function simulateUploadProgress(widget) {
        if(!widget) return;
        const circle = widget.querySelector('.progress-ring__circle');
        const nameText = widget.querySelector('.upload-filename');
        const circumference = 75.4; // 新的周长
        let progress = 0;

        // 10ms * 100次 = 1秒
        const interval = setInterval(() => {
            progress += 1; 
            const offset = circumference - (progress / 100 * circumference);
            if(circle) circle.style.strokeDashoffset = offset;

            if (progress >= 100) {
                clearInterval(interval);
                
                // --- 阶段 1: 触发圆环闭环特效 ---
                widget.classList.add('is-complete');
                
                // --- 阶段 2: 等待特效结束(400ms)，再显示文件名 ---
                setTimeout(() => {
                    if(nameText) nameText.classList.add('show-name');
                }, 400); // 这个时间要和 CSS 里的 animation 时间一致
            }
        }, 10); 
    }

    // 全局监听
    document.addEventListener('change', function(e) {
        if (e.target && (
            e.target.matches('input[type="file"]') || 
            e.target.classList.contains('pplr_monogram') ||
            e.target.classList.contains('fileupload')
        )) {
            handleFileUpload(e.target);
        }
    });
})();