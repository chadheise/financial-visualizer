import datetime as dt

def string_to_date(dateString):
    format = '%m/%d/%Y'
    return dt.datetime.strptime(dateString, format).date()

def date_string_sort_key(dateString):
    format = '%m/%d/%Y'
    # Use arbitrary date for comparison of all dates
    referenceDate = dt.datetime.strptime('01/01/1970', format).date()
    return (dt.datetime.strptime(dateString, format).date() - referenceDate).total_seconds()

def extract_date_sort_key(dict):
    dateString = dict["date"]
    return date_string_sort_key(dateString)

def days_in_year(year):
    delta = dt.datetime(year, 12, 31) - dt.datetime(year, 1, 1)
    return delta.days + 1