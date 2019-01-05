import sys
import numpy as np
import matplotlib.pyplot as plt
import datetime as dt
import matplotlib.dates as mdates

from colors import color_scale
from csvParsers import *
from dateManipulation import *

def main(sources_file):
    print("Reading source data...")
    sources = readSources(sources_file)

    # List of lists where each top level list is a data source and each child list
    # contains maps of data
    # data = [readSourceFile(info["file"]) for info in sources]
    # TODO: Consider doing this in a comprehension
    rawData = {}
    for source in sources:
        rawData[source["series"]] = {}
        rawData[source["series"]]["file"] = source["file"]
        rawData[source["series"]]["color"] = source["color"]
        rawData[source["series"]]["data"] = readSourceFile(source["file"])

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
    dates = sorted(list(dates), key=dateStringSortKey)
    dateIndexMap = {dates[i]:i for i in range(0, len(dates))}

    ySeries = createSparseData(dates, dateIndexMap, rawData)

    print("Extrapolating data...")
    extrapolateMissingData(dates, ySeries)

    print("Plotting data...")
    createPlot(dates, ySeries, seriesNames, colors)

#------------------- Data manipulation methods -------------------#

def createSparseData(dates, dateIndexMap, rawData):
    sparseData = []
    for source, info in rawData.items():
        principleValues = [None] * len(dates)
        earningsValues = [None] * len(dates)
        # Keeping a running sum relies on the fact that the raw data entries are sorted by date in readSourceFile()
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
def extrapolateMissingData(dates, sparseData):
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
                    previousDate = stringToDate(dates[i-1]) 
                    thisDate = stringToDate(dates[i])
                    nextDate = stringToDate(dates[j])
                    numDaysSincePrevious = float((thisDate - previousDate).days)
                    daysDifference = float((nextDate - previousDate).days)

                    previousValue = series[i-1]
                    nextValue = series[j]
                    valueDifference = nextValue - previousValue

                    valuePerDay = valueDifference / daysDifference
                    series[i] = previousValue + valuePerDay * numDaysSincePrevious
            i += 1

#------------------- Output methods -------------------#

def createPlot(dates, ySeries, seriesNames, colors):
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
    y_step = y_max / 20
    y_max_rounded = (int(y_max / y_step) + 2) * y_step
    y_range = np.arange(y_max_rounded, step=y_step)
    plt.yticks(y_range, ['$%d' % (value) for value in y_range])

    plt.title('Account Values Over Time')
    plt.legend(loc='upper left')

    plt.show()

#------------------- ------------------- -------------------#

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python stackedPlot.py <sourcesFile.csv>")
        exit()
    file_name = sys.argv[1]
    main(file_name)
