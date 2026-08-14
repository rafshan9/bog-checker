import json
from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Idea, BlogPost
from .serializers import IdeaSerializer, BlogPostSerializer
from .ai_agent import generate_ideas, evaluate_post

class IdeaViewSet(viewsets.ModelViewSet):
    queryset = Idea.objects.all().order_by('-created_at')
    serializer_class = IdeaSerializer

class BlogPostViewSet(viewsets.ModelViewSet):
    queryset = BlogPost.objects.all().order_by('-updated_at')
    serializer_class = BlogPostSerializer

@api_view(['POST'])
def generate_ideas_view(request):
    topic = request.data.get('topic')
    if not topic:
        return Response({"error": "Topic is required"}, status=status.HTTP_400_BAD_REQUEST)
    
    result = generate_ideas(topic)
    if isinstance(result, dict) and "error" in result:
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    return Response(result, status=status.HTTP_200_OK)

@api_view(['POST'])
def evaluate_post_view(request):
    content = request.data.get('content')
    topic = request.data.get('topic')
    post_id = request.data.get('post_id')
    
    if not content or not topic:
        return Response({"error": "Content and topic are required"}, status=status.HTTP_400_BAD_REQUEST)
        
    result = evaluate_post(content, topic)
    if "error" in result:
        return Response(result, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    if post_id:
        try:
            post = BlogPost.objects.get(id=post_id)
            post.seo_score = result.get('seo_score')
            # Store the full evaluation result (feedback + checklist) as JSON
            post.seo_feedback = json.dumps({
                "feedback": result.get('feedback', ''),
                "checklist": result.get('checklist', [])
            })
            post.content = content
            post.save()
        except BlogPost.DoesNotExist:
            pass
            
    return Response(result, status=status.HTTP_200_OK)
