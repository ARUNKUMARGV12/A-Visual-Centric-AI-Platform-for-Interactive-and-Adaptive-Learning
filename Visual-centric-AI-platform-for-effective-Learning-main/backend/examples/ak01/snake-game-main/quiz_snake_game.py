import pygame
import random
import sys

# Initialize Pygame
pygame.init()

# Game Constants
WIDTH, HEIGHT = 600, 600
CELL_SIZE = 20
FPS = 12
FONT = pygame.font.SysFont('Arial', 22)
BIG_FONT = pygame.font.SysFont('Arial', 36)

# Colors
WHITE = (255,255,255)
BLACK = (0,0,0)
GREEN = (0,200,0)
RED = (200,0,0)
YELLOW = (255,255,0)
BLUE = (0,0,200)
EGG_COLORS = [YELLOW, RED, BLUE, GREEN]

# Quiz Data: List of dicts with question, options, answer
QUIZ = [
    {
        "question": "What is the capital of France?",
        "options": ["Berlin", "London", "Paris", "Rome"],
        "answer": "Paris"
    },
    {
        "question": "2 + 2 = ?",
        "options": ["3", "4", "5", "2"],
        "answer": "4"
    },
    {
        "question": "Which is a mammal?",
        "options": ["Shark", "Dolphin", "Trout", "Octopus"],
        "answer": "Dolphin"
    },
    {
        "question": "Largest planet?",
        "options": ["Earth", "Mars", "Jupiter", "Venus"],
        "answer": "Jupiter"
    },
    {
        "question": "Python is a ...",
        "options": ["Snake", "Programming Language", "Car", "Fruit"],
        "answer": "Programming Language"
    }
]

# Helper Functions
def draw_text(surface, text, pos, font, color=WHITE, center=False):
    img = font.render(text, True, color)
    rect = img.get_rect()
    if center:
        rect.center = pos
    else:
        rect.topleft = pos
    surface.blit(img, rect)

def random_cell():
    x = random.randint(0, (WIDTH - CELL_SIZE) // CELL_SIZE) * CELL_SIZE
    y = random.randint(3, (HEIGHT - CELL_SIZE) // CELL_SIZE) * CELL_SIZE  # leave space for question
    return x, y

def render_question_and_eggs(screen, question_data, egg_positions):
    # Draw question at top
    draw_text(screen, question_data["question"], (10, 10), FONT, YELLOW)
    # Draw eggs (options)
    for idx, (opt, pos) in enumerate(zip(question_data["options"], egg_positions)):
        pygame.draw.ellipse(screen, EGG_COLORS[idx % len(EGG_COLORS)],
                            (pos[0], pos[1], CELL_SIZE, CELL_SIZE))
        # Draw option text (A, B, C, D) over egg
        label = chr(ord('A') + idx)
        draw_text(screen, label, (pos[0]+CELL_SIZE//4, pos[1]+CELL_SIZE//4), FONT, BLACK)

def check_egg_collision(snake_head, egg_positions):
    for idx, pos in enumerate(egg_positions):
        egg_rect = pygame.Rect(pos[0], pos[1], CELL_SIZE, CELL_SIZE)
        if egg_rect.collidepoint(snake_head):
            return idx
    return None

def game_over_screen(screen, score, total):
    screen.fill(BLACK)
    draw_text(screen, "Game Over!", (WIDTH//2, HEIGHT//2-40), BIG_FONT, RED, center=True)
    draw_text(screen, f"Score: {score}/{total}", (WIDTH//2, HEIGHT//2), FONT, WHITE, center=True)
    draw_text(screen, "Press any key to exit.", (WIDTH//2, HEIGHT//2+40), FONT, YELLOW, center=True)
    pygame.display.flip()
    wait_for_key()

def wait_for_key():
    while True:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit(); sys.exit()
            if event.type == pygame.KEYDOWN:
                return

def main():
    screen = pygame.display.set_mode((WIDTH, HEIGHT))
    pygame.display.set_caption("Quiz Snake Game")
    clock = pygame.time.Clock()

    # Snake initial state
    snake = [(WIDTH//2, HEIGHT//2)]
    direction = (0, -CELL_SIZE)
    grow_snake = False
    score = 0

    # Quiz state
    question_idx = 0
    egg_positions = []
    current_question = QUIZ[question_idx]

    # Place eggs randomly, no overlap with snake
    def place_eggs():
        positions = []
        used = set(snake)
        while len(positions) < len(current_question["options"]):
            pos = random_cell()
            if pos not in used and pos not in positions:
                positions.append(pos)
        return positions

    egg_positions = place_eggs()

    running = True
    while running:
        clock.tick(FPS)
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
            elif event.type == pygame.KEYDOWN:
                # Arrow keys
                if event.key == pygame.K_UP and direction != (0, CELL_SIZE):
                    direction = (0, -CELL_SIZE)
                elif event.key == pygame.K_DOWN and direction != (0, -CELL_SIZE):
                    direction = (0, CELL_SIZE)
                elif event.key == pygame.K_LEFT and direction != (CELL_SIZE, 0):
                    direction = (-CELL_SIZE, 0)
                elif event.key == pygame.K_RIGHT and direction != (-CELL_SIZE, 0):
                    direction = (CELL_SIZE, 0)

        # Move snake
        new_head = (snake[0][0] + direction[0], snake[0][1] + direction[1])
        snake.insert(0, new_head)
        if not grow_snake:
            snake.pop()
        else:
            grow_snake = False

        # Check collisions with self or wall
        if (new_head[0] < 0 or new_head[0] >= WIDTH or
            new_head[1] < 0 or new_head[1] >= HEIGHT or
            new_head in snake[1:]):
            game_over_screen(screen, score, len(QUIZ))
            return

        # Check collision with eggs
        egg_idx = check_egg_collision(new_head, egg_positions)
        if egg_idx is not None:
            selected_option = current_question["options"][egg_idx]
            if selected_option == current_question["answer"]:
                score += 1
                grow_snake = True
            # Next question
            question_idx += 1
            if question_idx >= len(QUIZ):
                game_over_screen(screen, score, len(QUIZ))
                return
            current_question = QUIZ[question_idx]
            egg_positions = place_eggs()

        # Draw everything
        screen.fill(BLACK)
        # Draw snake
        for i, pos in enumerate(snake):
            color = GREEN if i > 0 else WHITE
            pygame.draw.rect(screen, color, (pos[0], pos[1], CELL_SIZE, CELL_SIZE))
        # Draw eggs and question
        render_question_and_eggs(screen, current_question, egg_positions)
        # Draw score
        draw_text(screen, f"Score: {score}", (WIDTH-120, 10), FONT, WHITE)
        pygame.display.flip()

    pygame.quit()

if __name__ == "__main__":
    main()
