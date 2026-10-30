from typing import Any
from app.adapters.base import AgriculturalDataAdapter

class GIAI4AFSAdapter(AgriculturalDataAdapter):
    """Placeholder only. Configure after official API docs and credentials are provided."""
    name = "GI-AI4AFS"
    configured = False

    async def fetch(self, **kwargs) -> dict[str, Any]:
        return {
            "configured": False,
            "source": self.name,
            "data": None,
            "message": "No endpoint or credentials configured. No connection has been attempted."
        }
