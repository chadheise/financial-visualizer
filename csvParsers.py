import csv

from dateManipulation import extractDateSortKey

def read_sources(file_name):
    with open(file_name, 'r') as sources:
        reader = csv.reader(sources, delimiter=',')
        sources = [{"file": row[0], "series": row[1], "color": row[2]} for row in reader]
        sources = sources[1:] # Remove headers
    return sources

def read_source_file(file_name):
    with open(file_name, 'r') as source:
        reader = csv.reader(source, delimiter=',')
        reader.__next__() # Remove headers
        source = [{"date": row[0], "balance": float(row[1]), "investment": float(row[2]), "earnings": float(row[3])} for row in reader]
        # source = source[1:] # Remove headers
        # The fact that this is sorted is used to find closest values when extracting data
        source = sorted(source, key=extractDateSortKey) # sort by date
    return source