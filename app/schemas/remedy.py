from typing import List, Optional
from pydantic import BaseModel, Field


class Ingredient(BaseModel):
    name: str = Field(..., description="Name of the ingredient, e.g., 'Fresh Ginger'")
    amount: str = Field(..., description="Measurement and quantity, e.g., '1 inch crushed' or '1 tablespoon'")
    notes: Optional[str] = Field(None, description="Optional notes on the ingredient")


class RemedyCreate(BaseModel):
    name: str = Field(..., description="Title of the home remedy, e.g. 'Turmeric Golden Milk'")
    applicable_symptoms: List[str] = Field(..., description="List of symptoms this remedy addresses")
    ingredients: List[Ingredient] = Field(..., description="List of ingredients with quantities")
    preparation_steps: List[str] = Field(..., description="Step-by-step instructions to prepare")
    dosage_and_frequency: str = Field(..., description="Recommended dosage and schedule")
    precautions_and_contraindications: List[str] = Field(..., description="Mandatory safety warnings & contraindications")
    who_should_avoid: List[str] = Field(..., description="Specific groups who must avoid this (e.g. infants, pregnancy, medication conflicts)")
    possible_side_effects: Optional[List[str]] = Field(default_factory=list, description="Known minor side effects if any")
    tags: Optional[List[str]] = Field(default_factory=list, description="Categorization tags, e.g. ['immunity', 'cough', 'throat']")


class RemedyBulkCreate(BaseModel):
    remedies: List[RemedyCreate] = Field(..., description="List of remedies to ingest in bulk")


class RemedyResponse(BaseModel):
    id: str
    name: str
    applicable_symptoms: List[str]
    ingredients: List[Ingredient]
    preparation_steps: List[str]
    dosage_and_frequency: str
    precautions_and_contraindications: List[str]
    who_should_avoid: List[str]
    possible_side_effects: List[str] = []
    tags: List[str] = []
    message: Optional[str] = "Success"
