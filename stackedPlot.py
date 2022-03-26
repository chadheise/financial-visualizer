import sys
import numpy as np
import matplotlib.pyplot as plt
import datetime as dt
import matplotlib.dates as mdates

from colors import color_scale
from csvParsers import *
from dateManipulation import *
from utils import get_factor_of_ten

def main(sources_file, start_date):
    print("Reading source data...")
    sources = read_sources(sources_file)

    # List of lists where each top level list is a data source and each child list
    # contains maps of data
    # data = [read_source_file(info["file"]) for info in sources]
    # TODO: Consider doing this in a comprehension
    rawData = {}
    for source in sources:
        print("   Reading " + source["file"])
        rawData[source["series"]] = {}
        rawData[source["series"]]["file"] = source["file"]
        rawData[source["series"]]["color"] = source["color"]
        rawData[source["series"]]["data"] = read_source_file(source["file"])

    # Ordered lists to use in plot
    seriesNames = []
    colors = []

    for series in rawData:
        seriesNames.append(series + " Principle")
        colors.append(rawData[series]["color"])
        seriesNames.append(series + " Earnings")
        colors.append(color_scale(rawData[series]["color"], 1.5))   

    dates = set() # Use a set to avoid duplicates
    for source, info in rawData.items():
        for entry in info["data"]:
            dates.add(entry["date"])
    dates = sorted(list(dates), key=date_string_sort_key)
    dateIndexMap = {dates[i]:i for i in range(0, len(dates))}

    ySeries = create_sparse_data(dates, dateIndexMap, rawData)

    print("Extrapolating data...")
    extrapolate_missing_data(dates, ySeries)

    if start_date:
        print("Filtering data by date...")
        dates, ySeries = filter_by_date(dates, ySeries, start_date)

    print("Plotting data...")
    create_plot(dates, ySeries, seriesNames, colors)

#------------------- Data manipulation methods -------------------#

def create_sparse_data(dates, dateIndexMap, rawData):
    sparseData = []
    for source, info in rawData.items():
        principleValues = [None] * len(dates)
        earningsValues = [None] * len(dates)
        # Keeping a running sum relies on the fact that the raw data entries are sorted by date in read_source_file()
        principleSum = 0 
        earningsSum = 0
        for entry in info["data"]:
            index = dateIndexMap[entry["date"]]
            principleSum += entry["investment"]
            principleValues[index] = principleSum
            earningsSum += entry["earnings"]
            earningsValues[index] = earningsSum
        sparseData.append(principleValues)
        sparseData.append(earningsValues)
    return sparseData

'''
    Fills in any missing data points by linear approximation.
    Input is an array of arrays
'''
# TODO: Consider not modifying the data in place
def extrapolate_missing_data(dates, sparseData):
    for series in sparseData:
        i = 0
        # Replace leading None values with 0s
        while(i < len(series) and series[i] is None):
            series[i] = 0
            i += 1

        while(i < len(series)):
            if (series[i] is None):
                ## Move forward until you find next value or end of list
                j = i
                while(j < len(series) and series[j] is None):
                    j += 1

                if (j >= len(series)): # If we are at the end of the list
                    # Fill in the value with the last known value
                    series[i] = series[i-1]
                    # TODO: Consider short cutting here by filling in all remaining values & breaking
                else:
                    # Extrapolate the value using a linear regression

                    # dates[i-1] and series[i-1] are guaranteed to exist since we populate None values
                    # at the front of the list with 0s
                    previousDate = string_to_date(dates[i-1]) 
                    thisDate = string_to_date(dates[i])
                    nextDate = string_to_date(dates[j])
                    numDaysSincePrevious = float((thisDate - previousDate).days)
                    daysDifference = float((nextDate - previousDate).days)

                    previousValue = series[i-1]
                    nextValue = series[j]
                    valueDifference = nextValue - previousValue

                    valuePerDay = valueDifference / daysDifference
                    series[i] = previousValue + valuePerDay * numDaysSincePrevious
            i += 1

'''
    Filters the output based on the provided start date.
    Requires the dates and data provided as inputs are already sorted.
'''
def filter_by_date(dates, sparse_data, start_date_string):
    # TODO: Put the start date in the date list before extrapolating data to guarantee
    # a datapoint on the start date
    startDate = dt.datetime.strptime(start_date_string, '%m/%d/%Y').date()
    startIndex = 0
    while(dt.datetime.strptime(dates[startIndex], '%m/%d/%Y').date() < startDate):
        startIndex += 1

    dates = dates[startIndex:]
    sparseData = [series[startIndex:] for series in sparse_data]
    return (dates, sparseData)

#------------------- Output methods -------------------#

def create_plot(dates, ySeries, seriesNames, colors):
    x = [dt.datetime.strptime(d,'%m/%d/%Y').date() for d in dates]
    
    plt.gca().xaxis.set_major_formatter(mdates.DateFormatter('%m/%d/%Y'))
    plt.gca().xaxis.set_major_locator(mdates.DayLocator())
    plt.stackplot(x, ySeries, labels=seriesNames, colors=colors)

    daysCovered = (x[-1] - x[0]).days
    numXTicks = 20 if len(x) > 20 else len(x)
    xTickGap = int(len(x) / numXTicks)
    xTicks = x[::xTickGap]
    plt.xticks(xTicks, rotation=45)

    y_max = max(np.sum(ySeries, axis=0))

    y_min_num_ticks = 10
    y_max_num_ticks = 20
    y_step = get_factor_of_ten(y_max / y_max_num_ticks)

    # Ensure there is a good number of ticks
    while((y_max / y_step) < y_min_num_ticks):
        y_step = int(y_step / 2)
    y_range = np.arange(y_max + y_step, step=y_step)
    plt.yticks(y_range, ['$%d' % (value) for value in y_range])
    plt.ylim(bottom=0)

    plt.title('Account Values Over Time')
    plt.legend(loc='upper left')

    plt.show()

#------------------- ------------------- -------------------#

if __name__ == '__main__':
    if len(sys.argv) != 2 and len(sys.argv) != 3:
        print("Usage: python stackedPlot.py <sourcesFile.csv> <optionalStartDate>")
        exit()
    file_name = sys.argv[1]
    start_date = None
    if len(sys.argv) > 2:
        start_date = sys.argv[2]
    main(file_name, start_date)
