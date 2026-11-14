from sqlalchemy import (
    Column, String, Integer, ForeignKey,
    Text, DateTime
)
from sqlalchemy.orm import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()


def new_id():
    return str(uuid.uuid4())


class Project(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=new_id)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class SourceFile(Base):
    __tablename__ = "source_files"

    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(
        String, ForeignKey("projects.id"), nullable=False
    )
    path = Column(String(1000), nullable=False)
    language = Column(String(100))
    file_hash = Column(String(64))


class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(
        String, ForeignKey("projects.id"), nullable=False
    )
    file_id = Column(
        String, ForeignKey("source_files.id")
    )
    explanation = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)


class Migration(Base):
    __tablename__ = "migrations"

    id = Column(String, primary_key=True, default=new_id)
    project_id = Column(
        String, ForeignKey("projects.id"), nullable=False
    )
    target_stack = Column(String(255))
    status = Column(String(50), default="pending")
    report = Column(Text)