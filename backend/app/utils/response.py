from typing import Any
from pydantic import BaseModel


class APIResponse(BaseModel):
    code: int = 0
    message: str = "success"
    data: Any = None

    @classmethod
    def ok(cls, data: Any = None, message: str = "success") -> "APIResponse":
        return cls(code=0, message=message, data=data)

    @classmethod
    def error(cls, code: int, message: str, data: Any = None) -> "APIResponse":
        return cls(code=code, message=message, data=data)
