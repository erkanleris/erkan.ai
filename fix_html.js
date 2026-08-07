const fs = require('fs');

let html = fs.readFileSync('artifacts/erkan-ai/index.html', 'utf8');

const themeScript = `
    <script>
      (function() {
        try {
          var PRESET = {
            dark: { bg: "2, 8, 23", bgGrad1: "#0b1f4a", bgGrad2: "#060e2a", primary: "31, 139, 255", secondary: "168, 85, 247", surface: "16, 24, 58", textMain: "#ffffff", textMuted: "255, 255, 255", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(var(--surface-rgb), 0.6)" },
            amoled: { bg: "0, 0, 0", bgGrad1: "#050505", bgGrad2: "#020202", primary: "59, 130, 246", secondary: "168, 85, 247", surface: "10, 10, 10", textMain: "#ffffff", textMuted: "255, 255, 255", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(var(--surface-rgb), 0.9)" },
            light: { bg: "248, 250, 252", bgGrad1: "#e2e8f0", bgGrad2: "#f1f5f9", primary: "37, 99, 235", secondary: "147, 51, 234", surface: "255, 255, 255", textMain: "#0f172a", textMuted: "15, 23, 42", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(255, 255, 255, 0.9)" },
            purple: { bg: "15, 10, 31", bgGrad1: "#2d1b4e", bgGrad2: "#1a0b2e", primary: "168, 85, 247", secondary: "216, 180, 254", surface: "28, 19, 53", textMain: "#ffffff", textMuted: "255, 255, 255", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(var(--surface-rgb), 0.6)" },
            blue: { bg: "5, 15, 35", bgGrad1: "#0f2c68", bgGrad2: "#08183a", primary: "59, 130, 246", secondary: "96, 165, 250", surface: "15, 28, 65", textMain: "#ffffff", textMuted: "255, 255, 255", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(var(--surface-rgb), 0.6)" },
            cyan: { bg: "4, 20, 26", bgGrad1: "#0b3d4f", bgGrad2: "#06222c", primary: "6, 182, 212", secondary: "34, 211, 238", surface: "12, 35, 45", textMain: "#ffffff", textMuted: "255, 255, 255", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(var(--surface-rgb), 0.6)" },
            green: { bg: "5, 20, 10", bgGrad1: "#0c4021", bgGrad2: "#072412", primary: "34, 197, 94", secondary: "74, 222, 128", surface: "15, 38, 22", textMain: "#ffffff", textMuted: "255, 255, 255", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(var(--surface-rgb), 0.6)" },
            emerald: { bg: "2, 20, 15", bgGrad1: "#064536", bgGrad2: "#03261e", primary: "16, 185, 129", secondary: "52, 211, 153", surface: "8, 38, 30", textMain: "#ffffff", textMuted: "255, 255, 255", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(var(--surface-rgb), 0.6)" },
            yellow: { bg: "23, 20, 5", bgGrad1: "#473d0a", bgGrad2: "#262205", primary: "234, 179, 8", secondary: "250, 204, 21", surface: "43, 37, 12", textMain: "#ffffff", textMuted: "255, 255, 255", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(var(--surface-rgb), 0.6)" },
            orange: { bg: "25, 12, 5", bgGrad1: "#5c2a0d", bgGrad2: "#331607", primary: "249, 115, 22", secondary: "251, 146, 60", surface: "48, 25, 13", textMain: "#ffffff", textMuted: "255, 255, 255", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(var(--surface-rgb), 0.6)" },
            red: { bg: "25, 5, 5", bgGrad1: "#5e0f0f", bgGrad2: "#360808", primary: "239, 68, 68", secondary: "248, 113, 113", surface: "48, 15, 15", textMain: "#ffffff", textMuted: "255, 255, 255", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(var(--surface-rgb), 0.6)" },
            pink: { bg: "25, 5, 15", bgGrad1: "#5e0f38", bgGrad2: "#360820", primary: "236, 72, 153", secondary: "244, 114, 182", surface: "48, 15, 30", textMain: "#ffffff", textMuted: "255, 255, 255", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(var(--surface-rgb), 0.6)" },
            rose: { bg: "25, 4, 10", bgGrad1: "#5e0b23", bgGrad2: "#360614", primary: "244, 63, 94", secondary: "251, 113, 133", surface: "48, 12, 22", textMain: "#ffffff", textMuted: "255, 255, 255", bubbleUser: "linear-gradient(135deg, rgb(var(--primary-rgb)), rgb(var(--secondary-rgb)))", bubbleAi: "rgba(var(--surface-rgb), 0.6)" }
          };
          var theme = localStorage.getItem('erkan_theme');
          var colors = PRESET.dark;
          
          if (theme === 'custom') {
            try {
              var customStr = localStorage.getItem('erkan_custom_theme');
              if (customStr) {
                var c = JSON.parse(customStr);
                if (c && typeof c === 'object' && c.bg && c.primary && c.surface && c.textMain) {
                  colors = c;
                }
              }
            } catch(e) {}
          } else if (theme && PRESET[theme]) {
            colors = PRESET[theme];
          }

          var root = document.documentElement;
          root.style.setProperty('--bg-rgb', colors.bg);
          root.style.setProperty('--bg-grad-1', colors.bgGrad1);
          root.style.setProperty('--bg-grad-2', colors.bgGrad2);
          root.style.setProperty('--primary-rgb', colors.primary);
          root.style.setProperty('--secondary-rgb', colors.secondary);
          root.style.setProperty('--surface-rgb', colors.surface);
          root.style.setProperty('--text-main', colors.textMain);
          root.style.setProperty('--text-rgb', colors.textMuted);
          root.style.setProperty('--bubble-user', colors.bubbleUser);
          root.style.setProperty('--bubble-ai', colors.bubbleAi);
          
          if (colors.bg === PRESET.light.bg) root.classList.add("light-theme");
        } catch(e) {}
      })();
    </script>`;

html = html.replace('</head>', themeScript + '\n  </head>');

fs.writeFileSync('artifacts/erkan-ai/index.html', html);
console.log('done');
