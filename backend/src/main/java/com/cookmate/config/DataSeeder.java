package com.cookmate.config;

import com.cookmate.entity.Recipe;
import com.cookmate.entity.User;
import com.cookmate.repository.RecipeRepository;
import com.cookmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedDefaultUser();
        seedRecipes();
    }

        @SuppressWarnings("null")
        private void seedRecipes() {
        if (recipeRepository.count() > 0) {
            return;
        }

        List<Recipe> seedRecipes = List.of(
                Recipe.builder()
                        .title("Masala Egg Rice")
                        .region("Indian")
                        .cookTimeMinutes(12)
                        .estimatedCost(90)
                        .calories(420)
                        .imageUrl("https://images.unsplash.com/photo-1512058564366-18510be2db19")
                        .videoUrl("https://www.youtube.com/watch?v=kRCH8kD1GD0")
                        .ingredients(List.of("rice", "egg", "onion", "oil", "salt", "chili"))
                        .steps(List.of(
                                "Boil or use leftover rice.",
                                "Saute onion in oil for 2 minutes.",
                                "Scramble egg and mix rice with salt/chili.",
                                "Cook 3 minutes and serve."
                        ))
                        .build(),
                Recipe.builder()
                        .title("Japanese Tamago Don")
                        .region("Japanese")
                        .cookTimeMinutes(15)
                        .estimatedCost(120)
                        .calories(450)
                        .imageUrl("https://images.unsplash.com/photo-1617093727343-374698b1b08d")
                        .videoUrl("https://www.youtube.com/watch?v=3mP5u8sRI8A")
                        .ingredients(List.of("egg", "rice", "soy sauce", "onion", "sugar"))
                        .steps(List.of(
                                "Cook onion with soy sauce and sugar.",
                                "Add beaten eggs and simmer.",
                                "Pour over hot rice and serve."
                        ))
                        .build(),
                Recipe.builder()
                        .title("Veggie Stir Noodles")
                        .region("Asian")
                        .cookTimeMinutes(10)
                        .estimatedCost(140)
                        .calories(390)
                        .imageUrl("https://images.unsplash.com/photo-1612929633738-8fe44f7ec841")
                        .videoUrl("https://www.youtube.com/watch?v=VjneaJ0hmgs")
                        .ingredients(List.of("noodles", "carrot", "capsicum", "soy sauce", "garlic"))
                        .steps(List.of(
                                "Boil noodles for 4 minutes.",
                                "Stir-fry veggies with garlic.",
                                "Add noodles and soy sauce, toss 2 minutes."
                        ))
                        .build(),
                Recipe.builder()
                        .title("Chickpea Salad Bowl")
                        .region("Mediterranean")
                        .cookTimeMinutes(8)
                        .estimatedCost(160)
                        .calories(310)
                        .imageUrl("https://images.unsplash.com/photo-1512621776951-a57141f2eefd")
                        .videoUrl("https://www.youtube.com/watch?v=7f6YlN_Az3M")
                        .ingredients(List.of("chickpea", "cucumber", "tomato", "lemon", "salt", "olive oil"))
                        .steps(List.of(
                                "Mix chopped vegetables and chickpeas.",
                                "Add lemon juice, olive oil, and salt.",
                                "Toss well and serve chilled."
                        ))
                        .build(),
                Recipe.builder()
                        .title("Budget Tomato Pasta")
                        .region("Italian")
                        .cookTimeMinutes(18)
                        .estimatedCost(130)
                        .calories(480)
                        .imageUrl("https://images.unsplash.com/photo-1481931715705-36f44b7fad59")
                        .videoUrl("https://www.youtube.com/watch?v=RmE8cGHJcDg")
                        .ingredients(List.of("pasta", "tomato", "onion", "garlic", "olive oil", "salt", "pepper"))
                        .steps(List.of(
                                "Saute onion and garlic in olive oil.",
                                "Add crushed tomatoes and simmer 8 minutes.",
                                "Toss cooked pasta with sauce and seasonings."
                        ))
                        .build(),
                Recipe.builder()
                        .title("Spiced Veg Poha")
                        .region("Indian")
                        .cookTimeMinutes(9)
                        .estimatedCost(70)
                        .calories(320)
                        .imageUrl("https://images.unsplash.com/photo-1505576399279-565b52d4ac71")
                        .videoUrl("https://www.youtube.com/watch?v=UO2u2V5ZfHg")
                        .ingredients(List.of("poha", "onion", "potato", "peanut", "curry leaves", "lemon", "chili"))
                        .steps(List.of(
                                "Rinse poha and let it drain.",
                                "Saute onion, chili, potato, and peanuts.",
                                "Toss poha with tempering and finish with lemon."
                        ))
                        .build(),
                Recipe.builder()
                        .title("Paneer Protein Wrap")
                        .region("Indian")
                        .cookTimeMinutes(14)
                        .estimatedCost(180)
                        .calories(510)
                        .imageUrl("https://images.unsplash.com/photo-1504754524776-8f4f37790ca0")
                        .videoUrl("https://www.youtube.com/watch?v=1-F5y_Qgx10")
                        .ingredients(List.of("paneer", "tortilla", "onion", "capsicum", "yogurt", "spice mix"))
                        .steps(List.of(
                                "Saute paneer with onions, capsicum, and spices.",
                                "Warm tortillas and spread yogurt sauce.",
                                "Fill, roll tight, and toast both sides."
                        ))
                        .build(),
                Recipe.builder()
                        .title("Garlic Butter Ramen")
                        .region("Asian")
                        .cookTimeMinutes(11)
                        .estimatedCost(110)
                        .calories(430)
                        .imageUrl("https://images.unsplash.com/photo-1528712306091-ed0763094c98")
                        .videoUrl("https://www.youtube.com/watch?v=rv1Q0vLK6vo")
                        .ingredients(List.of("noodles", "butter", "garlic", "soy sauce", "egg", "spring onion"))
                        .steps(List.of(
                                "Cook ramen noodles as per packet.",
                                "Melt butter, add garlic and soy sauce.",
                                "Toss noodles, top with soft-boiled egg and greens."
                        ))
                        .build(),
                Recipe.builder()
                        .title("Chickpea Hummus Toast")
                        .region("Mediterranean")
                        .cookTimeMinutes(7)
                        .estimatedCost(100)
                        .calories(360)
                        .imageUrl("https://images.unsplash.com/photo-1562967914-3784653eafed")
                        .videoUrl("https://www.youtube.com/watch?v=7Qf2Rj3G0kQ")
                        .ingredients(List.of("bread", "chickpea", "garlic", "lemon", "olive oil", "salt"))
                        .steps(List.of(
                                "Blend chickpeas with garlic, lemon, and olive oil.",
                                "Toast bread slices.",
                                "Spread hummus generously and drizzle oil."
                        ))
                        .build()
        );

        recipeRepository.saveAll(seedRecipes);
    }

        @SuppressWarnings("null")
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

        userRepository.save(demoUser);
    }
}
