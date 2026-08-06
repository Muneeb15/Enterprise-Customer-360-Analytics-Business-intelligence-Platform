from pydantic import BaseModel


class TeamMember(BaseModel):
    id: str
    name: str
    email: str
    role: str
    lastActive: str
