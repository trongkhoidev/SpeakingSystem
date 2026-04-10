
from sqlalchemy import text
from app.core.database import engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def fix_users_table():
    with engine.connect() as conn:
        logger.info("Đang kiểm tra và xóa ràng buộc Unique trên cột google_id...")
        try:
            # Tìm tên constraint (ràng buộc) Unique trên cột google_id
            query = text("""
                SELECT name 
                FROM sys.key_constraints 
                WHERE type = 'UQ' AND parent_object_id = OBJECT_ID('users')
                AND name LIKE 'UQ__users%'
            """)
            result = conn.execute(query).fetchone()
            
            if result:
                constraint_name = result[0]
                logger.info(f"Đã tìm thấy ràng buộc: {constraint_name}. Đang tiến hành xóa...")
                conn.execute(text(f"ALTER TABLE users DROP CONSTRAINT {constraint_name}"))
                conn.commit()
                logger.info("✓ Đã xóa ràng buộc thành công!")
            else:
                logger.info("Không tìm thấy ràng buộc Unique nào cần xóa.")
                
        except Exception as e:
            logger.error(f"❌ Lỗi khi sửa database: {e}")

if __name__ == "__main__":
    fix_users_table()
