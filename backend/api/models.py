from django.db import models

class Idea(models.Model):
    topic = models.CharField(max_length=255)
    title = models.CharField(max_length=255)
    keywords = models.TextField(help_text="Comma separated keywords")
    search_volume = models.CharField(max_length=50, null=True, blank=True)
    difficulty = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

class BlogPost(models.Model):
    idea = models.OneToOneField(Idea, on_delete=models.CASCADE, related_name='blog_post')
    content = models.TextField(blank=True, default="")
    seo_score = models.IntegerField(null=True, blank=True)
    seo_feedback = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Post for: {self.idea.title}"
