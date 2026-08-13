from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import IdeaViewSet, BlogPostViewSet, generate_ideas_view, evaluate_post_view

router = DefaultRouter()
router.register(r'ideas', IdeaViewSet)
router.register(r'posts', BlogPostViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('generate-ideas/', generate_ideas_view, name='generate-ideas'),
    path('evaluate-post/', evaluate_post_view, name='evaluate-post'),
]
