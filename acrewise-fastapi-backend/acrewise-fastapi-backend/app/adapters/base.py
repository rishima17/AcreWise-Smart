from abc import ABC, abstractmethod
from typing import Any

class AgriculturalDataAdapter(ABC):
    name: str
    configured: bool = False

    @abstractmethod
    async def fetch(self, **kwargs) -> dict[str, Any]:
        """Return normalized internal data and provenance metadata."""
        raise NotImplementedError
