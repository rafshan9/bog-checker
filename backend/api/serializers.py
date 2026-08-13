from rest_framework import serializers
from .models import Idea, BlogPost

class IdeaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Idea
        fields = '__all__'

class BlogPostSerializer(serializers.ModelSerializer):
    idea = IdeaSerializer(read_only=True)
    idea_id = serializers.PrimaryKeyRelatedField(queryset=Idea.objects.all(), source='idea', write_only=True)
    
    class Meta:
        model = BlogPost
        fields = '__all__'
