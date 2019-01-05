import datetime as dt

def stringToDate(dateString):
    format = '%m/%d/%Y'
    return dt.datetime.strptime(dateString, format).date()

def dateStringSortKey(dateString):
    format = '%m/%d/%Y'
    # Use arbitrary date for comparison of all dates
    referenceDate = dt.datetime.strptime('01/01/1970', format).date()
    return (dt.datetime.strptime(dateString, format).date() - referenceDate).total_seconds()

def extractDateSortKey(dict):
    dateString = dict["date"]
    return dateStringSortKey(dateString)

def daysInYear(year):
    delta = dt.datetime(year, 12, 31) - dt.datetime(year, 1, 1)
    return delta.days + 1