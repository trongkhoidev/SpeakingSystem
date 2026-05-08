
from app.core.database import engine
from sqlalchemy import text

def migrate():
    with engine.connect() as conn:
        print("Migrating database...")
        
        # 1. Update user_token_wallets
        try:
            conn.execute(text("ALTER TABLE user_token_wallets ADD expires_at NVARCHAR(50) NULL"))
            print("Added expires_at to user_token_wallets")
        except Exception: pass

        # 2. Update billing_plans (Tiered Prices)
        try:
            conn.execute(text("ALTER TABLE billing_plans ADD price_3m INT NULL"))
            print("Added price_3m to billing_plans")
        except Exception: pass
            
        try:
            conn.execute(text("ALTER TABLE billing_plans ADD price_6m INT NULL"))
            print("Added price_6m to billing_plans")
        except Exception: pass
            
        try:
            conn.execute(text("ALTER TABLE billing_plans ADD price_12m INT NULL"))
            print("Added price_12m to billing_plans")
        except Exception: pass

        # 3. Update subscription_requests
        try:
            conn.execute(text("ALTER TABLE subscription_requests ADD duration_months INT DEFAULT 1"))
            print("Added duration_months to subscription_requests")
        except Exception: pass

        # 4. Update users (Missing tracking columns)
        try:
            conn.execute(text("ALTER TABLE users ADD day_streak INT DEFAULT 0"))
            print("Added day_streak to users")
        except Exception: pass

        try:
            conn.execute(text("ALTER TABLE users ADD last_practice_date DATE NULL"))
            print("Added last_practice_date to users")
        except Exception: pass

        try:
            conn.execute(text("ALTER TABLE users ADD estimated_band DECIMAL(3, 1) DEFAULT 0.0"))
            print("Added estimated_band to users")
        except Exception: pass

        try:
            conn.execute(text("ALTER TABLE users ADD streak_calendar NVARCHAR(MAX) NULL"))
            print("Added streak_calendar to users")
        except Exception: pass

        # 5. Update billing_plans (Bank Info)
        try:
            conn.execute(text("ALTER TABLE billing_plans ADD bank_account_info NVARCHAR(MAX) NULL"))
            print("Added bank_account_info to billing_plans")
        except Exception: pass

        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
