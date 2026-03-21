package com.cookmate.config;

import com.cookmate.entity.Recipe;
import com.cookmate.entity.RecipeChallenge;
import com.cookmate.entity.User;
import com.cookmate.repository.RecipeChallengeRepository;
import com.cookmate.repository.RecipeRepository;
import com.cookmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RecipeRepository recipeRepository;
        private final RecipeChallengeRepository recipeChallengeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedDefaultUser();
        seedRecipes();
                seedWeeklyChallenge();
    }

        private void seedRecipes() {
        if (recipeRepository.count() > 0) {
            return;
        }

        List<Recipe> seedRecipes = List.of(
                Recipe.builder()
                        .title("Masala Egg Rice")
                        .region("Indian")
                        .prepTimeMinutes(8)
                        .cookTimeMinutes(12)
                        .difficulty("easy")
                        .estimatedCost(90)
                        .calories(420)
                        .imageUrl("https://images.unsplash.com/photo-1512058564366-18510be2db19")
                        .videoUrl("https://www.youtube.com/watch?v=kRCH8kD1GD0")
                        .ingredients(List.of("rice", "egg", "onion", "oil", "salt", "chili"))
                        .substitutionSuggestions(List.of("No rice? Use quinoa.", "No egg? Use tofu scramble.", "No chili? Use black pepper."))
                        .steps(List.of(
                                "Boil or use leftover rice.",
                                "Saute onion in oil for 2 minutes.",
                                "Scramble egg and mix rice with salt/chili.",
                                "Cook 3 minutes and serve."
                        ))
                        .stepVideoTimestampsSeconds(List.of(0, 55, 120, 185))
                        .versionNumber(1)
                        .build(),
                Recipe.builder()
                        .title("Japanese Tamago Don")
                        .region("Japanese")
                        .prepTimeMinutes(7)
                        .cookTimeMinutes(15)
                        .difficulty("medium")
                        .estimatedCost(120)
                        .calories(450)
                        .imageUrl("https://images.unsplash.com/photo-1617093727343-374698b1b08d")
                        .videoUrl("https://www.youtube.com/watch?v=3mP5u8sRI8A")
                        .ingredients(List.of("egg", "rice", "soy sauce", "onion", "sugar"))
                        .substitutionSuggestions(List.of("No soy sauce? Use tamari.", "No sugar? Use honey.", "No onion? Use scallions."))
                        .steps(List.of(
                                "Cook onion with soy sauce and sugar.",
                                "Add beaten eggs and simmer.",
                                "Pour over hot rice and serve."
                        ))
                        .stepVideoTimestampsSeconds(List.of(0, 90, 170))
                        .versionNumber(1)
                        .build(),
                Recipe.builder()
                        .title("Veggie Stir Noodles")
                        .region("Asian")
                        .prepTimeMinutes(6)
                        .cookTimeMinutes(10)
                        .difficulty("easy")
                        .estimatedCost(140)
                        .calories(390)
                        .imageUrl("https://images.unsplash.com/photo-1612929633738-8fe44f7ec841")
                        .videoUrl("https://www.youtube.com/watch?v=VjneaJ0hmgs")
                        .ingredients(List.of("noodles", "carrot", "capsicum", "soy sauce", "garlic"))
                        .substitutionSuggestions(List.of("No noodles? Use spaghetti.", "No capsicum? Use cabbage.", "No soy sauce? Use coconut aminos."))
                        .steps(List.of(
                                "Boil noodles for 4 minutes.",
                                "Stir-fry veggies with garlic.",
                                "Add noodles and soy sauce, toss 2 minutes."
                        ))
                        .stepVideoTimestampsSeconds(List.of(0, 80, 150))
                        .versionNumber(1)
                        .build(),
                Recipe.builder()
                        .title("Chickpea Salad Bowl")
                        .region("Mediterranean")
                        .prepTimeMinutes(10)
                        .cookTimeMinutes(8)
                        .difficulty("easy")
                        .estimatedCost(160)
                        .calories(310)
                        .imageUrl("https://images.unsplash.com/photo-1512621776951-a57141f2eefd")
                        .videoUrl("https://www.youtube.com/watch?v=7f6YlN_Az3M")
                        .ingredients(List.of("chickpea", "cucumber", "tomato", "lemon", "salt", "olive oil"))
                        .substitutionSuggestions(List.of("No chickpeas? Use white beans.", "No lemon? Use apple cider vinegar.", "No olive oil? Use avocado oil."))
                        .steps(List.of(
                                "Mix chopped vegetables and chickpeas.",
                                "Add lemon juice, olive oil, and salt.",
                                "Toss well and serve chilled."
                        ))
                        .stepVideoTimestampsSeconds(List.of(0, 70, 120))
                        .versionNumber(1)
                        .build(),
                Recipe.builder()
                        .title("Budget Tomato Pasta")
                        .region("Italian")
                        .prepTimeMinutes(10)
                        .cookTimeMinutes(18)
                        .difficulty("medium")
                        .estimatedCost(130)
                        .calories(480)
                        .imageUrl("https://images.unsplash.com/photo-1481931715705-36f44b7fad59")
                        .videoUrl("https://www.youtube.com/watch?v=RmE8cGHJcDg")
                        .ingredients(List.of("pasta", "tomato", "onion", "garlic", "olive oil", "salt", "pepper"))
                        .substitutionSuggestions(List.of("No pasta? Use whole wheat noodles.", "No tomato? Use canned passata.", "No garlic? Use garlic powder."))
                        .steps(List.of(
                                "Saute onion and garlic in olive oil.",
                                "Add crushed tomatoes and simmer 8 minutes.",
                                "Toss cooked pasta with sauce and seasonings."
                        ))
                        .stepVideoTimestampsSeconds(List.of(0, 110, 220))
                        .versionNumber(1)
                        .build(),
                Recipe.builder()
                        .title("Spiced Veg Poha")
                        .region("Indian")
                        .prepTimeMinutes(7)
                        .cookTimeMinutes(9)
                        .difficulty("easy")
                        .estimatedCost(70)
                        .calories(320)
                        .imageUrl("https://images.unsplash.com/photo-1505576399279-565b52d4ac71")
                        .videoUrl("https://www.youtube.com/watch?v=UO2u2V5ZfHg")
                        .ingredients(List.of("poha", "onion", "potato", "peanut", "curry leaves", "lemon", "chili"))
                        .substitutionSuggestions(List.of("No poha? Use flattened rice alternatives.", "No potato? Use peas.", "No peanuts? Use cashews."))
                        .steps(List.of(
                                "Rinse poha and let it drain.",
                                "Saute onion, chili, potato, and peanuts.",
                                "Toss poha with tempering and finish with lemon."
                        ))
                        .stepVideoTimestampsSeconds(List.of(0, 75, 140))
                        .versionNumber(1)
                        .build(),
                Recipe.builder()
                        .title("Paneer Protein Wrap")
                        .region("Indian")
                        .prepTimeMinutes(8)
                        .cookTimeMinutes(14)
                        .difficulty("medium")
                        .estimatedCost(180)
                        .calories(510)
                        .imageUrl("https://images.unsplash.com/photo-1504754524776-8f4f37790ca0")
                        .videoUrl("https://www.youtube.com/watch?v=1-F5y_Qgx10")
                        .ingredients(List.of("paneer", "tortilla", "onion", "capsicum", "yogurt", "spice mix"))
                        .substitutionSuggestions(List.of("No paneer? Use tofu.", "No tortilla? Use roti.", "No yogurt? Use hung curd."))
                        .steps(List.of(
                                "Saute paneer with onions, capsicum, and spices.",
                                "Warm tortillas and spread yogurt sauce.",
                                "Fill, roll tight, and toast both sides."
                        ))
                        .stepVideoTimestampsSeconds(List.of(0, 95, 170))
                        .versionNumber(1)
                        .build(),
                Recipe.builder()
                        .title("Garlic Butter Ramen")
                        .region("Asian")
                        .prepTimeMinutes(6)
                        .cookTimeMinutes(11)
                        .difficulty("easy")
                        .estimatedCost(110)
                        .calories(430)
                        .imageUrl("https://images.unsplash.com/photo-1528712306091-ed0763094c98")
                        .videoUrl("https://www.youtube.com/watch?v=rv1Q0vLK6vo")
                        .ingredients(List.of("noodles", "butter", "garlic", "soy sauce", "egg", "spring onion"))
                        .substitutionSuggestions(List.of("No butter? Use olive oil.", "No egg? Add mushrooms.", "No spring onion? Use chives."))
                        .steps(List.of(
                                "Cook ramen noodles as per packet.",
                                "Melt butter, add garlic and soy sauce.",
                                "Toss noodles, top with soft-boiled egg and greens."
                        ))
                        .stepVideoTimestampsSeconds(List.of(0, 85, 160))
                        .versionNumber(1)
                        .build(),
                Recipe.builder()
                        .title("Chickpea Hummus Toast")
                        .region("Mediterranean")
                        .prepTimeMinutes(5)
                        .cookTimeMinutes(7)
                        .difficulty("easy")
                        .estimatedCost(100)
                        .calories(360)
                        .imageUrl("https://images.unsplash.com/photo-1562967914-3784653eafed")
                        .videoUrl("https://www.youtube.com/watch?v=7Qf2Rj3G0kQ")
                        .ingredients(List.of("bread", "chickpea", "garlic", "lemon", "olive oil", "salt"))
                        .substitutionSuggestions(List.of("No chickpea? Use cannellini beans.", "No lemon? Use lime.", "No bread? Use pita."))
                        .steps(List.of(
                                "Blend chickpeas with garlic, lemon, and olive oil.",
                                "Toast bread slices.",
                                "Spread hummus generously and drizzle oil."
                        ))
                        .stepVideoTimestampsSeconds(List.of(0, 60, 120))
                        .versionNumber(1)
                        .build()
        );

        recipeRepository.saveAll(Objects.requireNonNull(seedRecipes));
    }

        private void seedWeeklyChallenge() {
                if (recipeChallengeRepository.findFirstByActiveTrueOrderByWeekStartDateDesc().isPresent()) {
                        return;
                }

                Recipe featured = recipeRepository.findAll().stream().findFirst().orElse(null);
                if (featured == null) {
                        return;
                }

                LocalDate today = LocalDate.now();
                LocalDate weekStart = today.with(DayOfWeek.MONDAY);
                LocalDate weekEnd = weekStart.plusDays(6);

                RecipeChallenge challenge = RecipeChallenge.builder()
                                .title("Cook This Week's Featured Dish")
                                .description("Cook the featured recipe, leave a tip, and earn your first social badge.")
                                .weekStartDate(weekStart)
                                .weekEndDate(weekEnd)
                                .featuredRecipe(featured)
                                .active(true)
                                .build();

                recipeChallengeRepository.save(challenge);
        }

        private void seedDefaultUser() {
        final String demoEmail = "student@example.com";
        if (userRepository.existsByEmail(demoEmail)) {
            return;
        }

        User demoUser = User.builder()
                .name("Student")
                .email(demoEmail)
                .password(passwordEncoder.encode("password123"))
                .build();

                userRepository.save(Objects.requireNonNull(demoUser));
    }
}
