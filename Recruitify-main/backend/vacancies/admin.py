from django.contrib import admin
from .models import Vacancy, Application


@admin.register(Vacancy)
class VacancyAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'organization',
        'status',
        'created_at',
    )

    list_filter = (
        'status',
        'organization',
    )

    search_fields = (
        'title',
        'description',
        'organization__name',
    )

    ordering = ('-created_at',)

    readonly_fields = (
        'created_at',
        'updated_at',
    )

    # Better UX for FK selection
    autocomplete_fields = ('organization',)


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = (
        'vacancy',
        'candidate',
        'final_score',
        'category',
        'status',
        'applied_at',
    )

    list_filter = (
        'status',
    )

    search_fields = (
        'vacancy__title',
        'candidate__name',
        'candidate__email',
    )

    ordering = ('-applied_at',)

    readonly_fields = (
        'applied_at',
        'updated_at',
    )

    autocomplete_fields = (
        'vacancy',
        'candidate',
    )
