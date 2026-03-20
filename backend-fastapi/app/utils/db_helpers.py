from sqlalchemy.orm import Session
from typing import List, Type, Any, Optional
from sqlalchemy import select, update, delete

def get_by_id(db: Session, model: Type, id: Any):
    """Retrieve a record by its primary key ID."""
    return db.query(model).filter(model.id == id).first()

def get_all(db: Session, model: Type, skip: int = 0, limit: int = 100):
    """Retrieve all records with pagination."""
    return db.query(model).offset(skip).limit(limit).all()

def find_first(db: Session, model: Type, **filters):
    """Find the first record matching the given filter criteria."""
    query = db.query(model)
    for key, value in filters.items():
        query = query.filter(getattr(model, key) == value)
    return query.first()

def find_all(db: Session, model: Type, **filters):
    """Find all records matching the given filter criteria."""
    query = db.query(model)
    for key, value in filters.items():
        query = query.filter(getattr(model, key) == value)
    return query.all()

def create_item(db: Session, model: Type, **kwargs):
    """Create and save a new record."""
    item = model(**kwargs)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

def update_item(db: Session, model: Type, id: Any, **kwargs):
    """Update an existing record by ID."""
    item = get_by_id(db, model, id)
    if not item:
        return None
    for key, value in kwargs.items():
        setattr(item, key, value)
    db.commit()
    db.refresh(item)
    return item

def delete_item(db: Session, model: Type, id: Any):
    """Delete a record by ID."""
    item = get_by_id(db, model, id)
    if not item:
        return False
    db.delete(item)
    db.commit()
    return True
