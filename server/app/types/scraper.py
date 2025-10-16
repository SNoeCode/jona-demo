from pydantic import BaseModel
from typing import List, Optional

class ScraperRequest(BaseModel):
    location: str = "remote"
    days: int = 15
    keywords: List[str]
    priority: Optional[str] = "medium"
    user_id: Optional[str] = None
    admin_user_id: Optional[str] = None
    admin_email: Optional[str] = None
    debug: Optional[bool] = False