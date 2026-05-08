
from app.core.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Migrating database...")
        
        # 1. Update user_token_wallets
        try:
            conn.execute(text("ALTER TABLE user_token_wallets ADD expires_at NVARCHAR(50) NULL"))
            print("Added expires_at to user_token_wallets")
        except Exception as e:
            print(f"user_token_wallets expires_at: {e}")

        # 2. Update billing_plans
        try:
            conn.execute(text("ALTER TABLE billing_plans ADD price_3m INT NULL"))
            print("Added price_3m to billing_plans")
        except Exception as e:
            print(f"billing_plans price_3m: {e}")
            
        try:
            conn.execute(text("ALTER TABLE billing_plans ADD price_6m INT NULL"))
            print("Added price_6m to billing_plans")
        except Exception as e:
            print(f"billing_plans price_6m: {e}")
            
        try:
            conn.execute(text("ALTER TABLE billing_plans ADD price_12m INT NULL"))
            print("Added price_12m to billing_plans")
        except Exception as e:
            print(f"billing_plans price_12m: {e}")

        # 3. Update subscription_requests
        try:
            conn.execute(text("ALTER TABLE subscription_requests ADD duration_months INT DEFAULT 1"))
            print("Added duration_months to subscription_requests")
        except Exception as e:
            print(f"subscription_requests duration_months: {e}")
            
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
