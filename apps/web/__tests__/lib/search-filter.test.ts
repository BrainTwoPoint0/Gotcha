/**
 * Tests for search and filter logic
 */

describe('Search & Filter Logic', () => {
  describe('Text Search', () => {
    interface Searchable {
      id: string;
      content: string;
      metadata?: Record<string, string>;
    }

    const searchItems = <T extends Searchable>(
      items: T[],
      query: string,
      fields: (keyof T)[]
    ): T[] => {
      if (!query.trim()) return items;

      const lowerQuery = query.toLowerCase();
      return items.filter((item) =>
        fields.some((field) => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerQuery);
          }
          return false;
        })
      );
    };

    const items: Searchable[] = [
      { id: '1', content: 'Great product!' },
      { id: '2', content: 'Needs improvement' },
      { id: '3', content: 'Absolutely great experience' },
      { id: '4', content: 'Not working as expected' },
    ];

    it('should return all items for empty query', () => {
      expect(searchItems(items, '', ['content'])).toHaveLength(4);
      expect(searchItems(items, '   ', ['content'])).toHaveLength(4);
    });

    it('should find matching items', () => {
      const results = searchItems(items, 'great', ['content']);
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(['1', '3']);
    });

    it('should be case insensitive', () => {
      const results = searchItems(items, 'GREAT', ['content']);
      expect(results).toHaveLength(2);
    });

    it('should return empty for no matches', () => {
      const results = searchItems(items, 'xyz123', ['content']);
      expect(results).toHaveLength(0);
    });

    it('should search multiple fields', () => {
      const itemsWithMeta: Searchable[] = [
        { id: '1', content: 'Hello', metadata: { tag: 'important' } },
        { id: '2', content: 'Important update', metadata: { tag: 'normal' } },
      ];
      // Note: This test shows the field must be a string at top level
      const results = searchItems(itemsWithMeta, 'important', ['content']);
      expect(results).toHaveLength(1);
    });
  });

  describe('Response Type Filtering', () => {
    type ResponseType = 'vote' | 'feedback';

    interface Response {
      id: string;
      type: ResponseType;
      vote?: 'up' | 'down';
    }

    const filterByType = (responses: Response[], type: ResponseType | 'all'): Response[] => {
      if (type === 'all') return responses;
      return responses.filter((r) => r.type === type);
    };

    const filterByVote = (responses: Response[], vote: 'up' | 'down' | 'all'): Response[] => {
      if (vote === 'all') return responses;
      return responses.filter((r) => r.vote === vote);
    };

    const responses: Response[] = [
      { id: '1', type: 'vote', vote: 'up' },
      { id: '2', type: 'vote', vote: 'down' },
      { id: '3', type: 'feedback' },
      { id: '4', type: 'vote', vote: 'up' },
    ];

    it('should return all for type "all"', () => {
      expect(filterByType(responses, 'all')).toHaveLength(4);
    });

    it('should filter by vote type', () => {
      expect(filterByType(responses, 'vote')).toHaveLength(3);
    });

    it('should filter by feedback type', () => {
      expect(filterByType(responses, 'feedback')).toHaveLength(1);
    });

    it('should filter by thumbs up', () => {
      expect(filterByVote(responses, 'up')).toHaveLength(2);
    });

    it('should filter by thumbs down', () => {
      expect(filterByVote(responses, 'down')).toHaveLength(1);
    });
  });

  describe('Date Range Filtering', () => {
    interface Timestamped {
      id: string;
      createdAt: Date;
    }

    const filterByDateRange = (
      items: Timestamped[],
      startDate: Date | null,
      endDate: Date | null
    ): Timestamped[] => {
      return items.filter((item) => {
        if (startDate && item.createdAt < startDate) return false;
        if (endDate && item.createdAt > endDate) return false;
        return true;
      });
    };

    const items: Timestamped[] = [
      { id: '1', createdAt: new Date('2024-01-15') },
      { id: '2', createdAt: new Date('2024-02-15') },
      { id: '3', createdAt: new Date('2024-03-15') },
      { id: '4', createdAt: new Date('2024-04-15') },
    ];

    it('should return all when no dates specified', () => {
      expect(filterByDateRange(items, null, null)).toHaveLength(4);
    });

    it('should filter by start date only', () => {
      const results = filterByDateRange(items, new Date('2024-03-01'), null);
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(['3', '4']);
    });

    it('should filter by end date only', () => {
      const results = filterByDateRange(items, null, new Date('2024-02-28'));
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(['1', '2']);
    });

    it('should filter by date range', () => {
      const results = filterByDateRange(items, new Date('2024-02-01'), new Date('2024-03-31'));
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(['2', '3']);
    });
  });

  describe('Rating Filtering', () => {
    interface RatedItem {
      id: string;
      rating: number | null;
    }

    const filterByRating = (
      items: RatedItem[],
      minRating: number | null,
      maxRating: number | null
    ): RatedItem[] => {
      return items.filter((item) => {
        if (item.rating === null) return minRating === null && maxRating === null;
        if (minRating !== null && item.rating < minRating) return false;
        if (maxRating !== null && item.rating > maxRating) return false;
        return true;
      });
    };

    const filterByExactRating = (items: RatedItem[], rating: number | null): RatedItem[] => {
      return items.filter((item) => item.rating === rating);
    };

    const items: RatedItem[] = [
      { id: '1', rating: 1 },
      { id: '2', rating: 3 },
      { id: '3', rating: 5 },
      { id: '4', rating: null },
      { id: '5', rating: 4 },
    ];

    it('should filter by minimum rating', () => {
      const results = filterByRating(items, 4, null);
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(['3', '5']);
    });

    it('should filter by maximum rating', () => {
      const results = filterByRating(items, null, 3);
      expect(results).toHaveLength(2);
    });

    it('should filter by rating range', () => {
      const results = filterByRating(items, 2, 4);
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(['2', '5']);
    });

    it('should filter by exact rating', () => {
      expect(filterByExactRating(items, 5)).toHaveLength(1);
      expect(filterByExactRating(items, null)).toHaveLength(1);
    });
  });

  describe('Project Filtering', () => {
    interface ProjectItem {
      id: string;
      projectId: string;
    }

    const filterByProject = (items: ProjectItem[], projectId: string | null): ProjectItem[] => {
      if (!projectId) return items;
      return items.filter((item) => item.projectId === projectId);
    };

    const filterByProjects = (items: ProjectItem[], projectIds: string[]): ProjectItem[] => {
      if (projectIds.length === 0) return items;
      return items.filter((item) => projectIds.includes(item.projectId));
    };

    const items: ProjectItem[] = [
      { id: '1', projectId: 'proj_a' },
      { id: '2', projectId: 'proj_b' },
      { id: '3', projectId: 'proj_a' },
      { id: '4', projectId: 'proj_c' },
    ];

    it('should return all for null project', () => {
      expect(filterByProject(items, null)).toHaveLength(4);
    });

    it('should filter by single project', () => {
      expect(filterByProject(items, 'proj_a')).toHaveLength(2);
    });

    it('should filter by multiple projects', () => {
      const results = filterByProjects(items, ['proj_a', 'proj_b']);
      expect(results).toHaveLength(3);
    });

    it('should return all for empty project list', () => {
      expect(filterByProjects(items, [])).toHaveLength(4);
    });
  });

  describe('Sorting', () => {
    interface Sortable {
      id: string;
      createdAt: Date;
      rating: number | null;
      content: string;
    }

    type SortField = 'createdAt' | 'rating' | 'content';
    type SortOrder = 'asc' | 'desc';

    const sortItems = (items: Sortable[], field: SortField, order: SortOrder): Sortable[] => {
      return [...items].sort((a, b) => {
        let comparison = 0;

        if (field === 'createdAt') {
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
        } else if (field === 'rating') {
          const aRating = a.rating ?? 0;
          const bRating = b.rating ?? 0;
          comparison = aRating - bRating;
        } else if (field === 'content') {
          comparison = a.content.localeCompare(b.content);
        }

        return order === 'desc' ? -comparison : comparison;
      });
    };

    const items: Sortable[] = [
      { id: '1', createdAt: new Date('2024-02-01'), rating: 3, content: 'Beta' },
      { id: '2', createdAt: new Date('2024-01-01'), rating: 5, content: 'Alpha' },
      { id: '3', createdAt: new Date('2024-03-01'), rating: 1, content: 'Gamma' },
    ];

    it('should sort by date ascending', () => {
      const sorted = sortItems(items, 'createdAt', 'asc');
      expect(sorted.map((s) => s.id)).toEqual(['2', '1', '3']);
    });

    it('should sort by date descending', () => {
      const sorted = sortItems(items, 'createdAt', 'desc');
      expect(sorted.map((s) => s.id)).toEqual(['3', '1', '2']);
    });

    it('should sort by rating ascending', () => {
      const sorted = sortItems(items, 'rating', 'asc');
      expect(sorted.map((s) => s.id)).toEqual(['3', '1', '2']);
    });

    it('should sort by rating descending', () => {
      const sorted = sortItems(items, 'rating', 'desc');
      expect(sorted.map((s) => s.id)).toEqual(['2', '1', '3']);
    });

    it('should sort by content alphabetically', () => {
      const sorted = sortItems(items, 'content', 'asc');
      expect(sorted.map((s) => s.id)).toEqual(['2', '1', '3']);
    });

    it('should not mutate original array', () => {
      const original = [...items];
      sortItems(items, 'createdAt', 'desc');
      expect(items.map((i) => i.id)).toEqual(original.map((i) => i.id));
    });
  });

  describe('Pagination', () => {
    const paginate = <T>(items: T[], page: number, pageSize: number): T[] => {
      const start = (page - 1) * pageSize;
      return items.slice(start, start + pageSize);
    };

    const getPaginationInfo = (
      totalItems: number,
      page: number,
      pageSize: number
    ): {
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      startItem: number;
      endItem: number;
    } => {
      const totalPages = Math.ceil(totalItems / pageSize);
      const startItem = (page - 1) * pageSize + 1;
      const endItem = Math.min(page * pageSize, totalItems);

      return {
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        startItem: totalItems > 0 ? startItem : 0,
        endItem,
      };
    };

    const items = Array.from({ length: 25 }, (_, i) => ({ id: String(i + 1) }));

    it('should return correct page of items', () => {
      const page1 = paginate(items, 1, 10);
      expect(page1).toHaveLength(10);
      expect(page1[0].id).toBe('1');

      const page2 = paginate(items, 2, 10);
      expect(page2).toHaveLength(10);
      expect(page2[0].id).toBe('11');
    });

    it('should handle last partial page', () => {
      const page3 = paginate(items, 3, 10);
      expect(page3).toHaveLength(5);
      expect(page3[0].id).toBe('21');
    });

    it('should return empty for out of range page', () => {
      const page5 = paginate(items, 5, 10);
      expect(page5).toHaveLength(0);
    });

    it('should calculate pagination info', () => {
      const info = getPaginationInfo(25, 1, 10);
      expect(info.totalPages).toBe(3);
      expect(info.hasNextPage).toBe(true);
      expect(info.hasPrevPage).toBe(false);
      expect(info.startItem).toBe(1);
      expect(info.endItem).toBe(10);
    });

    it('should handle middle page', () => {
      const info = getPaginationInfo(25, 2, 10);
      expect(info.hasNextPage).toBe(true);
      expect(info.hasPrevPage).toBe(true);
      expect(info.startItem).toBe(11);
      expect(info.endItem).toBe(20);
    });

    it('should handle last page', () => {
      const info = getPaginationInfo(25, 3, 10);
      expect(info.hasNextPage).toBe(false);
      expect(info.hasPrevPage).toBe(true);
      expect(info.endItem).toBe(25);
    });

    it('should handle empty list', () => {
      const info = getPaginationInfo(0, 1, 10);
      expect(info.totalPages).toBe(0);
      expect(info.startItem).toBe(0);
      expect(info.endItem).toBe(0);
    });
  });

  describe('Combined Filters', () => {
    interface ResponseItem {
      id: string;
      type: 'vote' | 'feedback';
      content: string;
      rating: number | null;
      projectId: string;
      createdAt: Date;
    }

    interface FilterCriteria {
      search?: string;
      type?: 'vote' | 'feedback' | 'all';
      minRating?: number;
      projectId?: string;
      startDate?: Date;
      endDate?: Date;
    }

    const applyFilters = (items: ResponseItem[], criteria: FilterCriteria): ResponseItem[] => {
      return items.filter((item) => {
        // Search filter
        if (
          criteria.search &&
          !item.content.toLowerCase().includes(criteria.search.toLowerCase())
        ) {
          return false;
        }

        // Type filter
        if (criteria.type && criteria.type !== 'all' && item.type !== criteria.type) {
          return false;
        }

        // Rating filter
        if (criteria.minRating && (item.rating === null || item.rating < criteria.minRating)) {
          return false;
        }

        // Project filter
        if (criteria.projectId && item.projectId !== criteria.projectId) {
          return false;
        }

        // Date range filter
        if (criteria.startDate && item.createdAt < criteria.startDate) {
          return false;
        }
        if (criteria.endDate && item.createdAt > criteria.endDate) {
          return false;
        }

        return true;
      });
    };

    const items: ResponseItem[] = [
      {
        id: '1',
        type: 'feedback',
        content: 'Great product',
        rating: 5,
        projectId: 'proj_a',
        createdAt: new Date('2024-01-15'),
      },
      {
        id: '2',
        type: 'vote',
        content: '',
        rating: null,
        projectId: 'proj_a',
        createdAt: new Date('2024-02-15'),
      },
      {
        id: '3',
        type: 'feedback',
        content: 'Needs work',
        rating: 2,
        projectId: 'proj_b',
        createdAt: new Date('2024-03-15'),
      },
      {
        id: '4',
        type: 'feedback',
        content: 'Great support',
        rating: 4,
        projectId: 'proj_a',
        createdAt: new Date('2024-04-15'),
      },
    ];

    it('should apply no filters when criteria is empty', () => {
      expect(applyFilters(items, {})).toHaveLength(4);
    });

    it('should apply single filter', () => {
      expect(applyFilters(items, { type: 'feedback' })).toHaveLength(3);
    });

    it('should apply multiple filters', () => {
      const results = applyFilters(items, {
        type: 'feedback',
        projectId: 'proj_a',
      });
      expect(results).toHaveLength(2);
    });

    it('should apply all filters together', () => {
      const results = applyFilters(items, {
        search: 'great',
        type: 'feedback',
        minRating: 4,
        projectId: 'proj_a',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      });
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id)).toEqual(['1', '4']);
    });

    it('should return empty when filters exclude all', () => {
      const results = applyFilters(items, {
        type: 'vote',
        minRating: 5, // Votes have no rating
      });
      expect(results).toHaveLength(0);
    });
  });

  describe('Filter State Management', () => {
    interface FilterState {
      search: string;
      type: 'all' | 'vote' | 'feedback';
      projectId: string | null;
      dateRange: { start: Date | null; end: Date | null };
    }

    const defaultFilterState: FilterState = {
      search: '',
      type: 'all',
      projectId: null,
      dateRange: { start: null, end: null },
    };

    const isFilterActive = (state: FilterState): boolean => {
      return (
        state.search !== '' ||
        state.type !== 'all' ||
        state.projectId !== null ||
        state.dateRange.start !== null ||
        state.dateRange.end !== null
      );
    };

    const countActiveFilters = (state: FilterState): number => {
      let count = 0;
      if (state.search) count++;
      if (state.type !== 'all') count++;
      if (state.projectId) count++;
      if (state.dateRange.start || state.dateRange.end) count++;
      return count;
    };

    const resetFilters = (): FilterState => ({ ...defaultFilterState });

    it('should detect no active filters', () => {
      expect(isFilterActive(defaultFilterState)).toBe(false);
    });

    it('should detect active search filter', () => {
      const state = { ...defaultFilterState, search: 'test' };
      expect(isFilterActive(state)).toBe(true);
    });

    it('should detect active type filter', () => {
      const state = { ...defaultFilterState, type: 'feedback' as const };
      expect(isFilterActive(state)).toBe(true);
    });

    it('should count active filters', () => {
      const state: FilterState = {
        search: 'test',
        type: 'feedback',
        projectId: 'proj_1',
        dateRange: { start: new Date(), end: null },
      };
      expect(countActiveFilters(state)).toBe(4);
    });

    it('should reset filters to default', () => {
      const state: FilterState = {
        search: 'test',
        type: 'feedback',
        projectId: 'proj_1',
        dateRange: { start: new Date(), end: new Date() },
      };
      const reset = resetFilters();
      expect(reset).toEqual(defaultFilterState);
      expect(isFilterActive(reset)).toBe(false);
    });
  });
});
