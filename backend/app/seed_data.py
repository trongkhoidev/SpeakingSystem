from app.core.database import SessionLocal
from app.models.sqlalchemy_models import Topic, Question, ExamSet
import json

def seed_data():
    db = SessionLocal()
    try:
        # 0. Clear existing data to avoid duplicates (Cascade might be needed if foreign keys exist)
        print("Clearing existing Topics and Questions...")
        db.query(Question).delete()
        db.query(Topic).delete()
        db.commit()

        # 1. Part 1 Topics & Questions
        print("Seeding Part 1 data...")
        part1_data = [
            {
                "topic": "Hometown",
                "questions": [
                    "Where is your hometown?",
                    "What do you like most about your hometown?",
                    "Is it a good place for young people to live?",
                    "How has your hometown changed in recent years?"
                ]
            },
            {
                "topic": "Work or Study",
                "questions": [
                    "Do you work or are you a student?",
                    "What do you like most about your job/studies?",
                    "What are your future plans for your career/education?",
                    "Why did you choose that subject/job?"
                ]
            },
            {
                "topic": "Daily Routine",
                "questions": [
                    "What is your favorite part of the day?",
                    "Do you prefer to work in the morning or evening?",
                    "What do you usually do on weekends?",
                    "Did you have the same routine when you were a child?"
                ]
            },
            {
                "topic": "Technology",
                "questions": [
                    "What kind of technology do you use every day?",
                    "How has technology changed the way you communicate?",
                    "Do you think technology makes our lives easier or more complicated?",
                    "What is one piece of technology you couldn't live without?"
                ]
            },
            {
                "topic": "Leisure Time",
                "questions": [
                    "What do you do in your free time?",
                    "Do you prefer to spend your free time alone or with others?",
                    "Are there any new hobbies you would like to try?",
                    "How important is it to have free time?"
                ]
            },
            {
                "topic": "Sports",
                "questions": [
                    "Do you like sports?",
                    "What kind of sports are popular in your country?",
                    "Did you play sports when you were a child?",
                    "Do you prefer watching sports or playing them?"
                ]
            },
            {
                "topic": "Cultures and Traditions",
                "questions": [
                    "What is your favorite festival or holiday?",
                    "How do people celebrate traditional festivals in your country?",
                    "Do you think it's important to maintain traditions?",
                    "How have festivals changed over time?"
                ]
            },
            {
                "topic": "Environment",
                "questions": [
                    "Do you try to recycle in your daily life?",
                    "What do you think is the biggest environmental problem in your city?",
                    "What can individuals do to help protect the environment?",
                    "Did you learn about the environment at school?"
                ]
            },
            {
                "topic": "Food and Dining",
                "questions": [
                    "Do you like cooking?",
                    "What is your favorite meal of the day?",
                    "Do you prefer eating at home or at a restaurant?",
                    "Is there any food you don't like?"
                ]
            },
            {
                "topic": "Travel",
                "questions": [
                    "Do you like traveling?",
                    "Where would you like to travel in the future?",
                    "What was the most interesting place you've ever visited?",
                    "How do you prefer to travel?"
                ]
            },
            {
                "topic": "Reading",
                "questions": [
                    "Do you like reading books?",
                    "What kind of books do you prefer?",
                    "Did you read much when you were a child?",
                    "Do you prefer reading physical books or e-books?"
                ]
            },
            {
                "topic": "Music",
                "questions": [
                    "What kind of music do you like?",
                    "How do you listen to music?",
                    "Did you learn to play a musical instrument as a child?",
                    "Do you think music is important in our lives?"
                ]
            }
        ]

        for item in part1_data:
            topic = Topic(name=item["topic"], part=1)
            db.add(topic)
            db.flush() # Get ID
            for q_text in item["questions"]:
                q = Question(question_text=q_text, part=1, topic_id=topic.id)
                db.add(q)

        # 2. Part 2 Cue Cards
        part2_data = [
            {
                "topic": "Describe a book you have recently read.",
                "bullets": [
                    "what the book is",
                    "who wrote it",
                    "what it is about",
                    "and explain why you liked or disliked it."
                ]
            },
            {
                "topic": "Describe a place you have visited that you would like to go back to.",
                "bullets": [
                    "where the place is",
                    "when you went there",
                    "what you did there",
                    "and explain why you want to visit it again."
                ]
            },
            {
                "topic": "Describe a person who has influenced you significantly.",
                "bullets": [
                    "who the person is",
                    "how you know them",
                    "what kind of person they are",
                    "and explain how they have influenced you."
                ]
            },
            {
                "topic": "Describe a beautiful city you have visited.",
                "bullets": [
                    "where it is",
                    "when you went there",
                    "what you did there",
                    "and explain why you think it is beautiful."
                ]
            },
            {
                "topic": "Describe a time when you were very busy.",
                "bullets": [
                    "when it was",
                    "what you had to do",
                    "how you managed your time",
                    "and explain how you felt about it."
                ]
            },
            {
                "topic": "Describe a special gift you gave to someone.",
                "bullets": [
                    "who you gave it to",
                    "what the gift was",
                    "why you chose it",
                    "and explain how the person felt about it."
                ]
            },
            {
                "topic": "Describe an important decision you made in your life.",
                "bullets": [
                    "what the decision was",
                    "when you made it",
                    "why you made it",
                    "and explain how it has impacted your life."
                ]
            },
            {
                "topic": "Describe a website you visit frequently.",
                "bullets": [
                    "what the website is",
                    "how you found it",
                    "what you use it for",
                    "and explain why you like it."
                ]
            }
        ]

        topic_p2 = Topic(name="Cue Cards", part=2)
        db.add(topic_p2)
        db.flush()

        for item in part2_data:
            q = Question(
                question_text=item["topic"], 
                part=2, 
                topic_id=topic_p2.id, 
                cue_card_json=json.dumps({"topic": item["topic"], "bullets": item["bullets"]})
            )
            db.add(q)

        # 3. Part 3 Discussion Questions
        part3_data = [
            {
                "topic": "Education & Career",
                "questions": [
                    "To what extent should the government be responsible for education?",
                    "Is it more important to have academic qualifications or practical experience?",
                    "How has the job market changed in your country in the last decade?",
                    "Should children be allowed to choose their own subjects at school?"
                ]
            },
            {
                "topic": "Environment",
                "questions": [
                    "What are the most serious environmental problems in the world today?",
                    "Whose responsibility is it to protect the environment?",
                    "How can individuals contribute to environmental protection?",
                    "Do you think international cooperation is necessary to solve climate change?"
                ]
            },
            {
                "topic": "Technology and Society",
                "questions": [
                    "How has technology changed the way people socialize?",
                    "Do you think technology makes our lives better or worse?",
                    "What are the potential risks of AI and automation?",
                    "How can we ensure that technology is used ethically?"
                ]
            },
            {
                "topic": "Globalization",
                "questions": [
                    "What are the benefits and drawbacks of globalization?",
                    "How has globalization affected traditional cultures?",
                    "Is it important to preserve local industries in a globalized world?",
                    "How does globalization influence international relations?"
                ]
            },
            {
                "topic": "Social Media",
                "questions": [
                    "How has social media impacted personal relationships?",
                    "Do you think social media is a reliable source of information?",
                    "What are the psychological effects of social media use?",
                    "Should social media platforms be regulated by the government?"
                ]
            },
            {
                "topic": "Health and Wellness",
                "questions": [
                    "What are the main health challenges facing the world today?",
                    "How can modern society promote a healthier lifestyle?",
                    "Do you think physical health is more important than mental health?",
                    "To what extent is the government responsible for public health?"
                ]
            },
            {
                "topic": "Tourism",
                "questions": [
                    "How does tourism affect local communities and economies?",
                    "What are the environmental impacts of modern tourism?",
                    "Do you think sustainable tourism is possible?",
                    "How should countries balance the benefits of tourism with its drawbacks?"
                ]
            },
            {
                "topic": "Cultural Identity",
                "questions": [
                    "What factors contribute to a person's cultural identity?",
                    "How does cultural identity influence behavior and values?",
                    "Is it possible for someone to have more than one cultural identity?",
                    "How can societies promote cultural understanding and tolerance?"
                ]
            }
        ]

        for item in part3_data:
            topic = Topic(name=item["topic"], part=3)
            db.add(topic)
            db.flush()
            for q_text in item["questions"]:
                q = Question(question_text=q_text, part=3, topic_id=topic.id)
                db.add(q)
        
        db.commit()

        # 3.5 Link Part 3 to Part 2 (New logic for Smart Fallback)
        print("Linking Part 3 to Part 2 questions...")
        p2_questions = db.query(Question).filter(Question.part == 2).all()
        for p2 in p2_questions:
            # Find Part 3 questions that match the same "theme"
            # For simplicity in seed, we use name matching or just pick a topic
            theme = "Tourism" if "city" in p2.question_text.lower() else \
                    "Education & Career" if "decision" in p2.question_text.lower() else \
                    "Technology and Society" if "website" in p2.question_text.lower() else \
                    "Education & Career" if "person" in p2.question_text.lower() else \
                    "Health and Wellness"
            
            p3_topic = db.query(Topic).filter(Topic.part == 3, Topic.name == theme).first()
            if p3_topic:
                p3_questions = db.query(Question).filter(Question.topic_id == p3_topic.id).all()
                for p3 in p3_questions:
                    p3.linked_part2_id = p2.id
        db.commit()

        db.commit()
        print("Topics and questions seeded successfully!")

        # 4. Create Exam Sets
        print("Clearing and seeding Exam Sets...")
        db.query(ExamSet).delete()
        
        def get_q_ids(part, topic_name=None, limit=4):
            query = db.query(Question).filter(Question.part == part)
            if topic_name:
                query = query.join(Topic).filter(Topic.name == topic_name)
            return [q.id for q in query.limit(limit).all()]

        exam_sets_data = [
            {
                "name": "Set 1: Home & Travel",
                "description": "Focuses on personal background and travel experiences.",
                "p1_topic": "Hometown",
                "p2_topic": "Describe a beautiful city you have visited.",
                "p3_topic": "Tourism",
                "difficulty": "easy",
                "tag": "Forecast Q2/2026"
            },
            {
                "name": "Set 2: Education & Career",
                "description": "Discussion about studies, work, and future aspirations.",
                "p1_topic": "Work or Study",
                "p2_topic": "Describe an important decision you made in your life.",
                "p3_topic": "Education & Career",
                "difficulty": "medium",
                "tag": "Forecast Q2/2026"
            },
            {
                "name": "Set 3: Technology & Society",
                "description": "Deep dive into digital life and social impacts.",
                "p1_topic": "Technology",
                "p2_topic": "Describe a website you visit frequently.",
                "p3_topic": "Social Media",
                "difficulty": "hard",
                "tag": "Forecast Q1/2026"
            },
            {
                "name": "Set 4: Lifestyle & Hobbies",
                "description": "Conversations about daily life, reading, and interests.",
                "p1_topic": "Daily Routine",
                "p2_topic": "Describe a book you have recently read.",
                "p3_topic": "Cultural Identity",
                "difficulty": "medium",
                "tag": "Forecast Q1/2026"
            },
            {
                "name": "Set 5: Environment & Future",
                "description": "Global challenges and environmental awareness.",
                "p1_topic": "Environment",
                "p2_topic": "Describe a place you have visited that you would like to go back to.",
                "p3_topic": "Environment",
                "difficulty": "hard",
                "tag": "General Pool"
            },
            {
                "name": "Set 6: Art & Creativity",
                "description": "Discussing art galleries, hobbies, and the role of creativity in society.",
                "p1_topic": "Leisure Time",
                "p2_topic": "Describe a special gift you gave to someone.",
                "p3_topic": "Cultural Identity",
                "difficulty": "medium",
                "tag": "Forecast Q2/2026"
            },
            {
                "name": "Set 7: Science & Discovery",
                "description": "Exploration of scientific impact and personal learning journeys.",
                "p1_topic": "Technology",
                "p2_topic": "Describe an important decision you made in your life.",
                "p3_topic": "Technology and Society",
                "difficulty": "hard",
                "tag": "Forecast Q1/2026"
            },
            {
                "name": "Set 8: Reading & Knowledge",
                "description": "Deep dive into literacy, books, and the evolution of reading habits.",
                "p1_topic": "Reading",
                "p2_topic": "Describe a book you have recently read.",
                "p3_topic": "Education & Career",
                "difficulty": "easy",
                "tag": "Forecast Q2/2026"
            },
            {
                "name": "Set 9: Sports & Health",
                "description": "Conversations about physical activity, popular sports, and healthy living.",
                "p1_topic": "Sports",
                "p2_topic": "Describe a place you have visited that you would like to go back to.",
                "p3_topic": "Health and Wellness",
                "difficulty": "medium",
                "tag": "Forecast Q1/2026"
            },
            {
                "name": "Set 10: Digital Life",
                "description": "Examining social media, websites, and the impact of the internet.",
                "p1_topic": "Technology",
                "p2_topic": "Describe a website you visit frequently.",
                "p3_topic": "Social Media",
                "difficulty": "hard",
                "tag": "Forecast Q2/2026"
            }
        ]

        for es in exam_sets_data:
            p1_ids = get_q_ids(1, es["p1_topic"], 4)
            p2_ids = get_q_ids(2, es["p2_topic"], 1)
            p3_ids = get_q_ids(3, es["p3_topic"], 4)
            
            q_ids_dict = {
                "part1": p1_ids,
                "part2": p2_ids,
                "part3": p3_ids
            }
            
            if any(len(ids) > 0 for ids in q_ids_dict.values()):
                exam_set = ExamSet(
                    name=es["name"],
                    description=es["description"],
                    question_ids_json=json.dumps(q_ids_dict),
                    estimated_minutes=14,
                    difficulty=es["difficulty"],
                    tag=es.get("tag")
                )
                db.add(exam_set)

        db.commit()
        print("Exam Sets seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"Error seeding data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
