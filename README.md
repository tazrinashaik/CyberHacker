# Cyber Hacker: Crack the Code

A browser game made with HTML, CSS, and JavaScript. It demonstrates **Hill Climbing as the only AI search algorithm**.

## Modes
- **Player Mode:** Guess the hidden four-digit code in 10 attempts. The game gives a closeness score.
- **Watch AI:** See the AI start with a random candidate, inspect neighboring codes, and move to a better candidate until it finds the secret.

## How Hill Climbing works here
A candidate code is a state. Fitness is `36 - sum(abs(candidate_digit - secret_digit))`; 36 is the perfect score. A neighbor is created by changing one digit up or down by one. The AI evaluates its neighbors and moves to the one with the highest score if that improves the current state. It repeats until the code is found. This simple fitness landscape is designed to make the algorithm's progress easy to see in a classroom demo. No BFS, DFS, A*, Minimax, or other search algorithm is implemented.

## Run it
1. Download and extract the ZIP.
2. Open the extracted folder in Visual Studio Code.
3. Open `index.html`.
4. For Live Server: install the **Live Server** extension by Ritwick Dey, right-click `index.html`, and select **Open with Live Server**.
5. Or double-click `index.html` to open it directly in your browser. No package installation is required.

## Files
- `index.html` — layout and controls
- `style.css` — responsive neon cyberpunk design
- `script.js` — game rules, scoring, and Hill Climbing logic

The best player score is saved in browser local storage. Google Fonts load when internet is available; fallback fonts work offline.
