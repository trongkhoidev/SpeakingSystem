import uuid
from app.core.database import SessionLocal
from app.models.sqlalchemy_models import Question, Topic, ExamSet

def seed():
    db = SessionLocal()
    try:
        # 1. Create Topics
        if db.query(Topic).count() == 0:
            topics_data = [
                # Part 1
                ("Home & Accommodation", 1, "Questions about where you live."),
                ("Work & Education", 1, "Questions about your job or studies."),
                ("Free Time & Hobbies", 1, "Questions about what you do for fun."),
                # Part 2
                ("People & Relationships", 2, "Describe influential people."),
                ("Books & Media", 2, "Describe books or movies."),
                # Part 3
                ("Technology in Society", 3, "Discussion on tech impact."),
                ("Education Systems", 3, "Discussion on school and learning.")
            ]

            topic_map = {}
            for name, part, desc in topics_data:
                t = Topic(
                    id=str(uuid.uuid4()),
                    name=name,
                    part=part,
                    description=desc,
                    order_index=len(topic_map)
                )
                db.add(t)
                topic_map[name] = t.id
            
            db.flush() # Get IDs
        else:
            print("Topics already exist. Fetching mapping...")
            existing_topics = db.query(Topic).all()
            topic_map = {t.name: t.id for t in existing_topics}

        # 2. Create Questions
        if db.query(Question).count() == 0:
            questions_data = [
                # Part 1: Home & Accommodation
                (1, "What is your hometown like?", topic_map["Home & Accommodation"], None),
                (1, "Do you live in a house or an apartment?", topic_map["Home & Accommodation"], None),
                (1, "What do you like most about your home?", topic_map["Home & Accommodation"], None),
                
                # Part 1: Work & Education
                (1, "Do you work or are you a student?", topic_map["Work & Education"], None),
                (1, "What are you studying?", topic_map["Work & Education"], None),
                (1, "Do you prefer to study in the morning or in the afternoon?", topic_map["Work & Education"], None),
                
                # Part 1: Free Time & Hobbies
                (1, "What do you like to do in your free time?", topic_map["Free Time & Hobbies"], None),
                (1, "How often do you use social media?", topic_map["Free Time & Hobbies"], None),
                (1, "Do you enjoy playing sports?", topic_map["Free Time & Hobbies"], None),
                
                # Part 2: People & Relationships
                (2, "Describe a person who has influenced you.", topic_map["People & Relationships"], '{"topic": "A person who influenced you", "bullets": ["Who they are", "How you met", "What they are like", "Explain how they influenced you"]}'),
                (2, "Describe a famous person you would like to meet.", topic_map["People & Relationships"], '{"topic": "A famous person you want to meet", "bullets": ["Who they are", "What they are famous for", "Why you want to meet them", "What you would ask them"]}'),
                
                # Part 2: Books & Media
                (2, "Describe a book you have recently read.", topic_map["Books & Media"], '{"topic": "A book you recently read", "bullets": ["What it is", "When you read it", "What it is about", "Explain why you enjoyed it"]}'),
                
                # Part 3: Technology in Society
                (3, "How has technology changed the way people communicate?", topic_map["Technology in Society"], None),
                (3, "Do you think artificial intelligence will replace human jobs?", topic_map["Technology in Society"], None),
                
                # Part 3: Education Systems
                (3, "Do you think children should be encouraged to read more books?", topic_map["Education Systems"], None),
                (3, "What are the qualities of a good teacher?", topic_map["Education Systems"], None),
            ]
            for part, text, t_id, cue_json in questions_data:
                q = Question(
                    id=str(uuid.uuid4()),
                    part=part,
                    question_text=text,
                    topic_id=t_id,
                    cue_card_json=cue_json,
                    order_index=0 # Simplified
                )
                db.add(q)
            db.commit()
            print(f"Successfully seeded {len(questions_data)} questions.")
        else:
            print("Questions already exist.")

        # 3. Create Exam Sets
        if db.query(ExamSet).count() == 0:
            all_questions = db.query(Question).all()
            q_p1 = [q.id for q in all_questions if q.part == 1]
            q_p2 = [q.id for q in all_questions if q.part == 2]
            q_p3 = [q.id for q in all_questions if q.part == 3]

            import json
            exam_sets_data = [
                ("Bộ đề #1: Home & Work", "Chủ đề nhà ở và công việc.", json.dumps({
                    "part1": q_p1[:4], "part2": q_p2[:1], "part3": q_p3[:4]
                }), 14, "easy"),
                ("Bộ đề #2: Media & Hobby", "Chủ đề sách, phim và sở thích.", json.dumps({
                    "part1": q_p1[3:7] if len(q_p1) > 6 else q_p1, 
                    "part2": q_p2[1:2] if len(q_p2) > 1 else q_p2, 
                    "part3": q_p3[1:3] if len(q_p3) > 2 else q_p3
                }), 12, "medium"),
                ("Bộ đề #3: Tech & Education", "Chủ đề công nghệ và giáo dục.", json.dumps({
                    "part1": q_p1[4:8] if len(q_p1) > 7 else q_p1, 
                    "part2": q_p2[0:1], 
                    "part3": q_p3[0:2]
                }), 15, "hard"),
            ]

            for name, desc, q_json, minutes, diff in exam_sets_data:
                es = ExamSet(
                    id=str(uuid.uuid4()),
                    name=name,
                    description=desc,
                    question_ids_json=q_json,
                    estimated_minutes=minutes,
                    difficulty=diff
                )
                db.add(es)
            
            db.commit()
            print(f"Successfully seeded {len(exam_sets_data)} exam sets.")
        else:
            print("Exam sets already exist.")

    except Exception as e:
        print(f"Error seeding: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()
