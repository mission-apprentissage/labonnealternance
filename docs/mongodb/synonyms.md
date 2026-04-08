# How to Use Synonyms with MongoDB Search

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with Compass

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB C++ driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in both the tabs to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

### Connect to your cluster using MongoDB Compass.

Open [Compass](https://www.mongodb.com/try/download/compass) and connect to your cluster. For detailed instructions, see [Connect to a Cluster via Compass](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/compass-connection/#std-label-atlas-connect-via-compass).

### Create the collection.

On the Database screen, select the database `sample_mflix`, then select Create Collection.

### Specify the collection name.

Enter `transport_synonyms` as the collection name and select Create Collection.

### Load sample data into the collection.

- Select the `transport_synonyms` collection if it's not already selected.

- Click Add Data for each of the sample documents to add to the collection.

- Click Insert Document to replace the default document.

- Copy and paste the following sample documents, one at a time, and click Insert to add the documents, one at a time, to the collection.

  ```json
  {
    "mappingType": "equivalent",
    "synonyms": ["car", "vehicle", "automobile"]
  }
  ```

  ```json
  {
    "mappingType": "explicit",
    "input": ["boat"],
    "synonyms": ["boat", "vessel", "sail"]
  }
  ```

</Tab>

<Tab name="Attire Synonyms">

Create and populate the `attire_synonyms` collection:

### Connect to your cluster using MongoDB Compass.

Open [Compass](https://www.mongodb.com/try/download/compass) and connect to your cluster. For detailed instructions, see [Connect to a Cluster via Compass](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/compass-connection/#std-label-atlas-connect-via-compass).

### Create the collection.

On the Database screen, select the database `sample_mflix`, then select Create Collection.

### Specify the collection name.

Enter `attire_synonyms` as the collection name and select Create Collection.

### Load sample data into the collection.

- Select the `attire_synonyms` collection if it's not already selected.

- Click Add Data for each of the sample documents to add to the collection.

- Click Insert Document to replace the default document.

- Copy and paste the following sample documents, one at a time, and click Insert to add the documents, one at a time, to the collection.

  ```json
  {
    "mappingType": "equivalent",
    "synonyms": ["dress", "apparel", "attire"]
  }
  ```

  ```json
  {
    "mappingType": "explicit",
    "input": ["hat"],
    "synonyms": ["hat", "fedora", "headgear"]
  }
  ```

</Tab>

</Tabs>

## Create the MongoDB Search Index

### Connect to your cluster using MongoDB Compass.

Open [Compass](https://www.mongodb.com/try/download/compass) and connect to your cluster. For detailed instructions, see [Connect to a Cluster via Compass](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/compass-connection/#std-label-atlas-connect-via-compass).

### Specify the database and collection.

On the Database screen, click the name of the database, then click the name of the collection.

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

- Click the Indexes tab, then select Search Indexes.

- Click Create Atlas Search Index to open the index creation dialog box.

- Name the index, `default`.

- Specify the JSON (Javascript Object Notation) MongoDB Search index definition.

  The following index definition specifies:

  - The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
    `lucene.english` as the default analyzer for both indexing and querying the `title` field.

  - The name `transportSynonyms` as the name for this synonym mapping.

  - The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

  ```json
  {
    "mappings": {
      "dynamic": false,
      "fields": {
        "title": {
          "analyzer": "lucene.english",
          "type": "string"
        }
      }
    },
    "synonyms": [
      {
        "analyzer": "lucene.english",
        "name": "transportSynonyms",
        "source": {
          "collection": "transport_synonyms"
        }
      }
    ]
  }
  ```

- Click Create Search Index.

</Tab>

<Tab name="Multiple Synonym Mappings">

- Click the Indexes tab, then select Search Indexes.

- Click Create Atlas Search Index to open the index creation dialog box.

- Name the index, `default`.

- Specify the JSON (Javascript Object Notation) MongoDB Search index definition.

  The following index definition specifies:

  - The `lucene.english` [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers) as the default analyzer for both indexing and querying the `title` field.

  - The name `transportSynonyms` and `attireSynonyms` as the names for the synonym mappings.

  - The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in the sample query in this tutorial).

  - The `attire_synonyms` collection as the source synonyms collection to look for synonyms for queries using `attireSynonyms` mapping. `attireSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in the sample query in this tutorial).

  ```json
  {
    "mappings": {
      "dynamic": false,
      "fields": {
        "title": {
          "analyzer": "lucene.english",
          "type": "string"
        }
      }
    },
    "synonyms": [
      {
        "analyzer": "lucene.english",
        "name": "transportSynonyms",
        "source": {
          "collection": "transport_synonyms"
        }
      },
      {
        "analyzer": "lucene.english",
        "name": "attireSynonyms",
        "source": {
          "collection": "attire_synonyms"
        }
      }
    ]
  }

  ```

- Click Create Search Index.

</Tab>

</Tabs>

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Connect to your cluster in MongoDB Compass.

Open MongoDB Compass and connect to your cluster. For detailed instructions on connecting, see [Connect to a Cluster via Compass](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/compass-connection/#std-label-atlas-connect-via-compass).

## Use the `movies` collection in the `sample_mflix` database.

On the Database screen, click the `sample_mflix` database, then click the `movies` collection.

## Run simple MongoDB Search queries on the `movies` collection.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

The query searches the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query includes the following stages:

- [$limit](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/) stage to limit the output to 10 results

- [$project](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/) stage to exclude all fields except `title` and add a field named `score`

To run this query in MongoDB Compass:

- Click the Aggregations tab.

- Click Select..., then configure each of the following pipeline stages by selecting the stage from the dropdown and adding the query for that stage. Click Add Stage to add additional stages.

  <table>
  <tr>
  <th id="Pipeline%20Stage">
  Pipeline Stage

  </th>
  <th id="Query">
  Query

  </th>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$search`

  </td>
  <td headers="Query">
  ```javascript
  {
    "index": "synonyms-tutorial",
    "text": {
      "path": "title",
      "query": "automobile",
      "synonyms": "transportSynonyms"
    }
  }
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$limit`

  </td>
  <td headers="Query">
  ```javascript
  10
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$project`

  </td>
  <td headers="Query">
  ```javascript
  {
    "_id": 0,
    "title": 1,
    "score": { "$meta": "searchScore" }
  }
  ```

  </td>
  </tr>
  </table>If you [enabled](https://www.mongodb.com/docs/compass/current/aggregation-pipeline-builder/#set-the-documents-limit-or-auto-preview-documents)
  Auto Preview, MongoDB Compass displays the following documents next to the `$project` pipeline stage:

  ```json
  {title Cars} {score 4.197734832763672}
  {title Planes, Trains & Automobiles} {score 3.8511905670166016}
  {title Car Wash} {score 3.39473032951355}
  {title Used Cars} {score 3.39473032951355}
  {title Blue Car} {score 3.39473032951355}
  {title Cars 2} {score 3.39473032951355}
  {title Stealing Cars} {score 3.39473032951355}
  {title Cop Car} {score 3.39473032951355}
  {title The Cars That Eat People} {score 2.8496146202087402}
  {title Khrustalyov, My Car!} {score 2.8496146202087402}
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

The query searches the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. It includes the following stages:

- [$limit](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/) stage to limit the output to 10 results

- [$project](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/) stage to exclude all fields except `title` and add a field named `score`

To run this query in MongoDB Compass:

- Click the Aggregations tab.

- Click Select..., then configure each of the following pipeline stages by selecting the stage from the dropdown and adding the query for that stage. Click Add Stage to add additional stages.

  <table>
  <tr>
  <th id="Pipeline%20Stage">
  Pipeline Stage

  </th>
  <th id="Query">
  Query

  </th>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$search`

  </td>
  <td headers="Query">
  ```javascript
  {
    "index": "synonyms-tutorial",
    "text": {
      "path": "title",
      "query": "boat",
      "synonyms": "transportSynonyms"
    }
  }
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$limit`

  </td>
  <td headers="Query">
  ```javascript
  10
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$project`

  </td>
  <td headers="Query">
  ```javascript
  {
    "_id": 0,
    "title": 1,
    "score": { "$meta": "searchScore" }
  }
  ```

  </td>
  </tr>
  </table>If you [enabled](https://www.mongodb.com/docs/compass/current/aggregation-pipeline-builder/#set-the-documents-limit-or-auto-preview-documents)
  Auto Preview, MongoDB Compass displays the following documents next to the `$project` pipeline stage:

  ```json
  {title Vessel} {score 5.373150825500488}
  {title Boats} {score 4.589139938354492}
  {title And the Ship Sails On} {score 4.3452959060668945}
  {title Broken Vessels} {score 4.3452959060668945}
  {title Sailing to Paradise} {score 4.3452959060668945}
  {title Boat People} {score 3.711261749267578}
  {title Boat Trip} {score 3.711261749267578}
  {title Three Men in a Boat} {score 3.1153182983398438}
  {title The Glass Bottom Boat} {score 3.1153182983398438}
  {title Jack Goes Boating} {score 3.1153182983398438}
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index that contains multiple synonym mappings.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

The query searches the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

The query includes the following stages:

- [$limit](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/) stage to limit the output to 10 results

- [$project](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/) stage to exclude all fields except `title` and add a field named `score`

To run this query in MongoDB Compass:

- Click the Aggregations tab.

- Click Select..., then configure each of the following pipeline stages by selecting the stage from the dropdown and adding the query for that stage. Click Add Stage to add additional stages.

  <table>
  <tr>
  <th id="Pipeline%20Stage">
  Pipeline Stage

  </th>
  <th id="Query">
  Query

  </th>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$search`

  </td>
  <td headers="Query">
  ```javascript
  {
    "index": "synonyms-tutorial",
    "compound": {
      "should": [{
        "text": {
          "path": "title",
          "query": "automobile",
          "synonyms": "transportSynonyms"
        }
      },
      {
        "text": {
          "path": "title",
          "query": "attire",
          "synonyms": "attireSynonyms"
        }
      }]
    }
  }
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$limit`

  </td>
  <td headers="Query">
  ```javascript
  10
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$project`

  </td>
  <td headers="Query">
  ```javascript
  {
    "_id": 0,
    "title": 1,
    "score": { "$meta": "searchScore" }
  }
  ```

  </td>
  </tr>
  </table>If you [enabled](https://www.mongodb.com/docs/compass/current/aggregation-pipeline-builder/#set-the-documents-limit-or-auto-preview-documents)
  Auto Preview, MongoDB Compass displays the following documents next to the `$project` pipeline stage:

  ```json
  { title: 'The Dress', score: 4.812004089355469 },
  { title: 'Cars', score: 4.197734832763672 },
  { title: 'Dressed to Kill', score: 3.891493320465088 },
  { title: '27 Dresses', score: 3.891493320465088 },
  { title: 'Planes, Trains & Automobiles', score: 3.8511905670166016 },
  { title: 'Car Wash', score: 3.39473032951355 },
  { title: 'Used Cars', score: 3.39473032951355 },
  { title: 'Blue Car', score: 3.39473032951355 },
  { title: 'Cars 2', score: 3.39473032951355 },
  { title: 'Stealing Cars', score: 3.39473032951355 }
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

The query searches the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

The query includes the following stages:

- [$limit](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/) stage to limit the output to 10 results

- [$project](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/) stage to exclude all fields except `title` and add a field named `score`

To run this query in MongoDB Compass:

- Click the Aggregations tab.

- Click Select..., then configure each of the following pipeline stages by selecting the stage from the dropdown and adding the query for that stage. Click Add Stage to add additional stages.

  <table>
  <tr>
  <th id="Pipeline%20Stage">
  Pipeline Stage

  </th>
  <th id="Query">
  Query

  </th>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$search`

  </td>
  <td headers="Query">
  ```javascript
  {
    "index": "synonyms-tutorial",
    "compound": {
      "should": [{
        "text": {
          "path": "title",
          "query": "boat",
          "synonyms": "transportSynonyms"
        }
      },
      {
        "text": {
          "path": "title",
          "query": "hat",
          "synonyms": "attireSynonyms"
        }
      }]
    }
  }
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$limit`

  </td>
  <td headers="Query">
  ```javascript
  10
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$project`

  </td>
  <td headers="Query">
  ```javascript
  {
    "_id": 0,
    "title": 1,
    "score": { "$meta": "searchScore" }
  }
  ```

  </td>
  </tr>
  </table>If you [enabled](https://www.mongodb.com/docs/compass/current/aggregation-pipeline-builder/#set-the-documents-limit-or-auto-preview-documents)
  Auto Preview, MongoDB Compass displays the following documents next to the `$project` pipeline stage:

  ```json
  { title: 'Fedora', score: 5.673145294189453 },
  { title: 'Vessel', score: 5.373150825500488 },
  { title: 'Boats', score: 4.589139938354492 },
  { title: 'And the Ship Sails On', score: 4. 3452959060668945 },
  { title: 'Broken Vessels', score: 4.3452959060668945 },
  { title: 'Sailing to Paradise', score: 4.3452959060668945 },
  { title: 'Top Hat', score: 4.066137313842773 },
  { title: 'A Hatful of Rain', score: 4.066137313842773 },
  { title: 'Boat People', score: 3.711261749267578 },
  { title: 'Boat Trip', score: 3.711261749267578 }
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection using the Mongo Shell

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database, and then use the synonyms source collections with an index of the `movies` collection in the same database.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in both the tabs to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

### Connect to the deployment using mongosh.

In your terminal, connect to your Atlas cloud-hosted deployment or local deployment from [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh). For detailed instructions on how to connect, see [Connect to a Deployment](https://www.mongodb.com/docs/mongodb-shell/connect/).

### Switch to the `sample_mflix` database.

```shell
 use sample_mflix
```

```shell
switched to db sample_mflix
```

### Create the `transport_synonyms` collection.

```shell
 db.createCollection("transport_synonyms")
```

```shell
{ "ok" : 1 }
```

### Insert documents into the `transport_synonyms` collection.

Insert the following documents that define synonym mappings:

```shell
 db.transport_synonyms.insertMany([
   {
     "mappingType": "equivalent",
     "synonyms": ["car", "vehicle", "automobile"]
   },
   {
     "mappingType": "explicit",
     "input": ["boat"],
     "synonyms": ["boat", "vessel", "sail"]
   }
 ])
```

```shell
{
  "acknowledged" : true,
  "insertedIds" : [
    ObjectId("..."),
    ObjectId("...")
  ]
}
```

</Tab>

<Tab name="Attire Synonyms">

Create and populate the `attire_synonyms` collection:

### Connect to the deployment using mongosh.

In your terminal, connect to your Atlas cloud-hosted deployment or local deployment from [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh). For detailed instructions on how to connect, see [Connect to a Deployment](https://www.mongodb.com/docs/mongodb-shell/connect/).

### Switch to the `sample_mflix` database.

```shell
 use sample_mflix
```

```shell
switched to db sample_mflix
```

### Create the `attire_synonyms` collection.

```shell
 db.createCollection("attire_synonyms")
```

```shell
{ "ok" : 1 }
```

### Insert documents into the `attire_synonyms` collection.

Insert the following documents that define synonym mappings:

```shell
 db.attire_synonyms.insertMany([
   {
     "mappingType": "equivalent",
     "synonyms": ["dress", "apparel", "attire"]
   },
   {
     "mappingType": "explicit",
     "input": ["hat"],
     "synonyms": ["hat", "fedora", "headgear"]
   }
 ])
```

```shell
{
  "acknowledged" : true,
  "insertedIds" : [
    ObjectId("..."),
    ObjectId("...")
  ]
}
```

</Tab>

</Tabs>

## Create the MongoDB Search Index

### Connect to the deployment by using `mongosh`.

In your terminal, connect to your Atlas cloud-hosted deployment or local deployment from [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh). For detailed instructions on how to connect, see [Connect to a Deployment](https://www.mongodb.com/docs/mongodb-shell/connect/).

### Switch to the database that contains the collection for which you want to create the index.

```shell
 use sample_mflix
```

```shell
switched to db sample_mflix
```

### Run the `db.collection.createSearchIndex()` method to create the index.

To run the simple example query only, run the command in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the command that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```shell
db.movies.createSearchIndex(
  "default",
    {
      "mappings": {
        "dynamic": false,
        "fields": {
          "title": {
            "analyzer": "lucene.english",
            "type": "string"
          }
        }
      },
      "synonyms": [
        {
          "analyzer": "lucene.english",
          "name": "transportSynonyms",
          "source": {
            "collection": "transport_synonyms"
          }
        }
      ]
    }
)
```

```
default
```

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

</Tab>

<Tab name="Multiple Synonym Mappings">

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```shell
db.movies.createSearchIndex(
  "default",
    {
      "mappings": {
        "dynamic": false,
        "fields": {
          "title": {
            "analyzer": "lucene.english",
            "type": "string"
          }
        }
      },
      "synonyms": [
        {
          "analyzer": "lucene.english",
          "name": "transportSynonyms",
          "source": {
            "collection": "transport_synonyms"
          }
        },
        {
          "analyzer": "lucene.english",
          "name": "attireSynonyms",
          "source": {
            "collection": "attire_synonyms"
          }
        }
      ]
    }
)
```

```
default
```

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

</Tab>

</Tabs>

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Connect to your cluster in [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh).

Open [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh) in a terminal window and connect to your cluster. For detailed instructions on connecting, see [Connect to a Cluster via mongosh](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/mongo-shell-connection/).

## Use the `sample_mflix` database.

Run the following command at [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh) prompt:

```javascript
use sample_mflix
```

## Run the following example queries on the `movies` collection.

If you created an index with a single synonym mapping definition, run the query in the Simple Example tab below. If you defined multiple synonym mappings in your index, you can run the queries in both the tabs below.

These queries use the following pipeline stages:

- [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the collection.

- [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to `10` results.

- [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to:

  - Exclude all fields except the `title` field.

  - Add a field named `score`.

<Tabs>

<Tab name="Simple Example">

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

The query searches the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

```json
db.movies.aggregate([
  {
    $search: {
      "index": "synonyms-tutorial",
      "text": {
        "path": "title",
        "query": "automobile",
        "synonyms": "transportSynonyms"
      }
    }
  },
  {
    $limit: 10
  },
  {
    $project: {
      "_id": 0,
      "title": 1,
      "score": { $meta: "searchScore" }
    }
  }
])
```

```json
{ "title" : "Cars", "score" : 4.197734832763672 }
{ "title" : "Planes, Trains & Automobiles", "score" : 3.8511905670166016 }
{ "title" : "Car Wash", "score" : 3.39473032951355 }
{ "title" : "Used Cars", "score" : 3.39473032951355 }
{ "title" : "Blue Car", "score" : 3.39473032951355 }
{ "title" : "Cars 2", "score" : 3.39473032951355 }
{ "title" : "Stealing Cars", "score" : 3.39473032951355 }
{ "title" : "Cop Car", "score" : 3.39473032951355 }
{ "title" : "The Cars That Eat People", "score" : 2.8496146202087402 }
{ "title" : "Khrustalyov, My Car!", "score" : 2.8496146202087402 }
```

The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

The query searches the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

```json
db.movies.aggregate([
  {
    $search: {
      "index": "synonyms-tutorial",
      "text": {
        "path": "title",
        "query": "boat",
        "synonyms": "transportSynonyms"
      }
    }
  },
  {
    $limit: 10
  },
  {
    $project: {
      "_id": 0,
      "title": 1,
      "score": { $meta: "searchScore" }
    }
  }
])
```

```json
{ "title" : "Vessel", "score" : 5.373150825500488 }
{ "title" : "Boats", "score" : 4.589139938354492 }
{ "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
{ "title" : "Broken Vessels", "score" : 4.3452959060668945 }
{ "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
{ "title" : "Boat People", "score" : 3.711261749267578 }
{ "title" : "Boat Trip", "score" : 3.711261749267578 }
{ "title" : "Three Men in a Boat", "score" : 3.1153182983398438 }
{ "title" : "The Glass Bottom Boat", "score" : 3.1153182983398438 }
{ "title" : "Jack Goes Boating", "score" : 3.1153182983398438 }
```

The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

```json
{ "title" : "Vessel", "score" : 5.373150825500488 }
{ "title" : "Broken Vessels", "score" : 4.3452959060668945 }
```

MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

```json
{ "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
{ "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
```

MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

</Tab>

<Tab name="Advanced Example">

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

The query searches the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

```json
db.movies.aggregate([
  {
    $search: {
      "index": "synonyms-tutorial",
      "compound": {
        "should": [{
          "text": {
            "path": "title",
            "query": "automobile",
            "synonyms": "transportSynonyms"
          }
        },
        {
          "text": {
            "path": "title",
            "query": "attire",
            "synonyms": "attireSynonyms"
          }
        }]
      }
    }
  },
  {
    $limit: 10
  },
  {
    $project: {
      "_id": 0,
      "title": 1,
      "score": { $meta: "searchScore" }
    }
  }
])
```

```json
[
  { title: 'The Dress', score: 4.812004089355469 },
  { title: 'Cars', score: 4.197734832763672 },
  { title: 'Dressed to Kill', score: 3.891493320465088 },
  { title: '27 Dresses', score: 3.891493320465088 },
  { title: 'Planes, Trains & Automobiles', score: 3.8511905670166016 },
  { title: 'Car Wash', score: 3.39473032951355 },
  { title: 'Used Cars', score: 3.39473032951355 },
  { title: 'Blue Car', score: 3.39473032951355 },
  { title: 'Cars 2', score: 3.39473032951355 },
  { title: 'Stealing Cars', score: 3.39473032951355 }
]
```

The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

The query searches the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

```json
db.movies.aggregate([
  {
    $search: {
      "index": "synonyms-tutorial",
      "compound": {
        "should": [{
          "text": {
            "path": "title",
            "query": "boat",
            "synonyms": "transportSynonyms"
          }
        },
        {
          "text": {
            "path": "title",
            "query": "hat",
            "synonyms": "attireSynonyms"
          }
        }]
      }
    }
  },
  {
    $limit: 10
  },
  {
    $project: {
      "_id": 0,
      "title": 1,
      "score": { $meta: "searchScore" }
    }
  }
])
```

```json
[
  { title: 'Fedora', score: 5.673145294189453 },
  { title: 'Vessel', score: 5.373150825500488 },
  { title: 'Boats', score: 4.589139938354492 },
  { title: 'And the Ship Sails On', score: 4.3452959060668945 },
  { title: 'Broken Vessels', score: 4.3452959060668945 },
  { title: 'Sailing to Paradise', score: 4.3452959060668945 },
  { title: 'Top Hat', score: 4.066137313842773 },
  { title: 'A Hatful of Rain', score: 4.066137313842773 },
  { title: 'Boat People', score: 3.711261749267578 },
  { title: 'Boat Trip', score: 3.711261749267578 }
]
```

The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection in the Atlas UI

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### In Atlas, go to the Clusters page for your project.

- If it's not already displayed, select the organization that contains your desired project from the  Organizations menu in the navigation bar.

- If it's not already displayed, select your desired project from the Projects menu in the navigation bar.

- In the sidebar, click Clusters under the Database heading.

The [Clusters](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fclusters) page displays.

### In Atlas, go to the Data Explorer page for your project.

- If it's not already displayed, select the organization that contains your project from the  Organizations menu in the navigation bar.

- If it's not already displayed, select your project from the Projects menu in the navigation bar.

- In the sidebar, click Data Explorer under the Database heading.

  The [Data Explorer](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fmetrics%2FreplicaSet%2F%3Creplset%3E%2Fexplorer) displays.

IMPORTANT: You can also go to the Clusters page, and click Data Explorer under the Shortcuts heading.

### Create one or more sample synonyms collections in the `sample_mflix` database.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in both the tabs to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

- Expand the `sample_mflix` database and click the  icon to open the Create Collection  modal.

- Type `transport_synonyms` in the Collection name field.

- Click Create to create the collection in the `sample_mflix` database.

</Tab>

<Tab name="Attire Synonyms">

- Expand the `sample_mflix` database and click the  icon to open the Create Collection modal.

- Type `attire_synonyms` in the Collection name field.

- Click Create to create the collection in the `sample_mflix` database.

</Tab>

</Tabs>

### Load the sample data into the synonyms collection.

Follow the steps in the tabs to load data into the respective collection.

<Tabs>

<Tab name="Transport Synonyms">

- Select the `transport_synonyms` collection if it's not selected.

- Click Insert Document for each of the sample documents to add to the collection.

- Click the JSON (Javascript Object Notation) view ({}) to replace the default document.

- Copy and paste the following sample documents, one at a time, and click Insert to add the documents, one at a time, to the collection.

  ```json
  {
    "mappingType": "equivalent",
    "synonyms": ["car", "vehicle", "automobile"]
  }
  ```

  ```json
  {
    "mappingType": "explicit",
    "input": ["boat"],
    "synonyms": ["boat", "vessel", "sail"]
  }
  ```

</Tab>

<Tab name="Attire Synonyms">

- Select the `attire_synonyms` collection if it's not selected.

- Click Insert Document for each of the sample documents to add to the collection.

- Click the JSON (Javascript Object Notation) view ({}) to replace the default document.

- Copy and paste the following sample documents, one at a time, and click Insert to add the documents, one at a time, to the collection.

  ```json
  {
    "mappingType": "equivalent",
    "synonyms": ["dress", "apparel", "attire"]
  }
  ```

  ```json
  {
    "mappingType": "explicit",
    "input": ["hat"],
    "synonyms": ["hat", "fedora", "headgear"]
  }
  ```

</Tab>

</Tabs>

## Create the MongoDB Search Index

The synonym mapping in a collection's [index](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-ref) specifies the synonyms source collection and the analyzer to use with the collection.

In this section, you create a MongoDB Search index that defines one or many synonym mappings for the `sample_mflix.movies` collection. The mapping definition in the index references the synonyms source collection that you created in the `sample_mflix` database.

Atlas Search`synonyms-tutorial``sample_mflix` database`movies` collection### In Atlas, go to the Search & Vector Search page for your cluster.

You can go the MongoDB Search page from the Search & Vector Search option, or the Data Explorer.

<Tabs>

<Tab name="Search & Vector Search">

- If it's not already displayed, select the organization that contains your project from the  Organizations menu in the navigation bar.

- If it's not already displayed, select your project from the Projects menu in the navigation bar.

- In the sidebar, click Search & Vector Search under the Database heading.

  If you have no clusters, click Create cluster to create one. To learn more, see [Create a Cluster](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/tutorial/create-new-cluster/#std-label-create-new-cluster).

- If your project has multiple clusters, select the cluster you want to use from the Select cluster dropdown, then click Go to Search.

  The [Search & Vector Search](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fclusters%2FatlasSearch%2F%3Ccluster%3E) page displays.

</Tab>

<Tab name="Data Explorer">

- If it's not already displayed, select the organization that contains your project from the  Organizations menu in the navigation bar.

- If it's not already displayed, select your project from the Projects menu in the navigation bar.

- In the sidebar, click Data Explorer under the Database heading.

- Expand the database and select the collection.

- Click the Indexes tab for the collection.

- Click the Search and Vector Search link in the banner.

  The [Search & Vector Search](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fclusters%2FatlasSearch%2F%3Ccluster%3E%3Fdatabase%3Dsample_mflix%26collectionName%3Dusers) page displays.

</Tab>

</Tabs>

### Click Create Search Index.

### Start your index configuration.

Make the following selections on the page and then click Next.

<table>

<tr>
<td>
Search Type

</td>
<td>
Select the Atlas Search index type.

</td>
</tr>
<tr>
<td>
Index Name and Data Source

</td>
<td>
Specify the following information:

- Index Name: `synonyms-tutorial`

- Database and Collection:

  - `sample_mflix` database

  - `movies` collection

</td>
</tr>
<tr>
<td>
Configuration Method

</td>
<td>
For a guided experience, select Visual Editor.To edit the raw index definition, select JSON Editor.

</td>
</tr>
</table>IMPORTANT:

Your MongoDB Search index is named `default` by default. If you keep this name, then your index will be the default Search index for any MongoDB Search query that does not specify a different `index` option in its [operators](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-and-collectors/#std-label-fts-operators). If you are creating multiple indexes, we recommend that you maintain a consistent, descriptive naming convention across your indexes.

### Modify the default index definition.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

<Tabs>

<Tab name="Visual Editor">

- Click Refine Your Index.

- Click Add Field in the Field Mappings section.

- Click Customized Configuration.

- Configure the following fields in the Add Field Mapping window and click Add after:

  <table>
  <tr>
  <th id="UI%20Field%20Name">
  UI Field Name

  </th>
  <th id="Configuration">
  Configuration

  </th>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Field Name

  </td>
  <td headers="Configuration">
  Enter `title`.

  </td>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Enable Dynamic Mapping

  </td>
  <td headers="Configuration">
  Toggle to Off.

  </td>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Data Type Configuration

  </td>
  <td headers="Configuration">
  - Click Add Data Type.

  - Select String.

  - For Index Analyzer and Search Analyzer, click the dropdown to select lucene.english from the lucene.language analyzers dropdown.

  </td>
  </tr>
  </table>For all other fields not listed above, accept the default.

- Click Add Synonym Mapping in the Synonym Mappings section.

- Configure the following fields in the Add Synonym Mapping window and click Add after:

  <table>
  <tr>
  <th id="UI%20Field%20Name">
  UI Field Name

  </th>
  <th id="Configuration">
  Configuration

  </th>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Synonym Mapping Name

  </td>
  <td headers="Configuration">
  Enter `transportSynonyms`.

  </td>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Synonym Source Collection

  </td>
  <td headers="Configuration">
  Select `transport_synonyms`.

  </td>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Analyzer

  </td>
  <td headers="Configuration">
  Select `lucene.english`.

  </td>
  </tr>
  </table>

- Click Save Changes.

</Tab>

<Tab name="JSON Editor">

- Replace the default index definition with the following index definition.

  ```json
  {
    "mappings": {
      "dynamic": false,
      "fields": {
        "title": {
          "analyzer": "lucene.english",
          "type": "string"
        }
      }
    },
    "synonyms": [
      {
        "analyzer": "lucene.english",
        "name": "transportSynonyms",
        "source": {
          "collection": "transport_synonyms"
        }
      }
    ]
  }
  ```

- Click Next.

</Tab>

</Tabs>

</Tab>

<Tab name="Multiple Synonym Mappings">

The following index definition specifies:

- The `lucene.english` [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers) as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` and `attireSynonyms` as the names for the synonym mappings.

  - The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in the sample query in this tutorial).

  - The `attire_synonyms` collection as the source synonyms collection to look for synonyms for queries using `attireSynonyms` mapping. `attireSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in the sample query in this tutorial).

<Tabs>

<Tab name="Visual Editor">

- Click Refine Your Index.

- Click Add Field in the Field Mappings section.

- Configure the following fields in the Add Field Mapping window and then click Add:

  <table>
  <tr>
  <th id="UI%20Field%20Name">
  UI Field Name

  </th>
  <th id="Configuration">
  Configuration

  </th>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Field Name

  </td>
  <td headers="Configuration">
  Enter `title`.

  </td>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Enable Dynamic Mapping

  </td>
  <td headers="Configuration">
  Toggle to Off.

  </td>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Data Type Configuration

  </td>
  <td headers="Configuration">
  - Select String.

  - For Index Analyzer and Search Analyzer, click the dropdown to select lucene.english from the lucene.language analyzers dropdown.

  </td>
  </tr>
  </table>For all other fields not listed above, accept the default.

- Click Add Synonym Mapping in the Synonym Mappings section.

- Configure the following fields in the Add Synonym Mapping window and then click Add:

  <table>
  <tr>
  <th id="UI%20Field%20Name">
  UI Field Name

  </th>
  <th id="Configuration">
  Configuration

  </th>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Synonym Mapping Name

  </td>
  <td headers="Configuration">
  Enter `transportSynonyms`.

  </td>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Synonym Source Collection

  </td>
  <td headers="Configuration">
  Select `transport_synonyms`.

  </td>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Analyzer

  </td>
  <td headers="Configuration">
  Select `lucene.english`.

  </td>
  </tr>
  </table>

- Click Add Synonym Mapping again in the Synonym Mappings section.

- Configure the following fields in the Add Synonym Mapping window and click Add after:

  <table>
  <tr>
  <th id="UI%20Field%20Name">
  UI Field Name

  </th>
  <th id="Configuration">
  Configuration

  </th>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Synonym Mapping Name

  </td>
  <td headers="Configuration">
  Enter `attireSynonyms`.

  </td>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Synonym Source Collection

  </td>
  <td headers="Configuration">
  Select `attire_synonyms`.

  </td>
  </tr>
  <tr>
  <td headers="UI%20Field%20Name">
  Analyzer

  </td>
  <td headers="Configuration">
  Select `lucene.english`.

  </td>
  </tr>
  </table>

- Click Save Changes.

</Tab>

<Tab name="JSON Editor">

- Replace the default index definition with the following index definition.

  ```json
  {
    "mappings": {
      "dynamic": false,
      "fields": {
        "title": {
          "analyzer": "lucene.english",
          "type": "string"
        }
      }
    },
    "synonyms": [
      {
        "analyzer": "lucene.english",
        "name": "transportSynonyms",
        "source": {
          "collection": "transport_synonyms"
        }
      },
      {
        "analyzer": "lucene.english",
        "name": "attireSynonyms",
        "source": {
          "collection": "attire_synonyms"
        }
      }
    ]
  }
  ```

- Click Next.

</Tab>

</Tabs>

</Tab>

</Tabs>

### Click Create Search Index.

### Close the You're All Set! Modal Window.

A modal window appears to let you know your index is building. Click the Close button.

### Wait for the index to finish building.

The index should take about one minute to build. While it is building, the Status column reads `Build in Progress`. When it is finished building, the Status column reads `Active`.

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## In Atlas, go to the Search & Vector Search page for your cluster.

You can go the MongoDB Search page from the Search & Vector Search option, or the Data Explorer.

<Tabs>

<Tab name="Search & Vector Search">

- If it's not already displayed, select the organization that contains your project from the  Organizations menu in the navigation bar.

- If it's not already displayed, select your project from the Projects menu in the navigation bar.

- In the sidebar, click Search & Vector Search under the Database heading.

  If you have no clusters, click Create cluster to create one. To learn more, see [Create a Cluster](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/tutorial/create-new-cluster/#std-label-create-new-cluster).

- If your project has multiple clusters, select the cluster you want to use from the Select cluster dropdown, then click Go to Search.

  The [Search & Vector Search](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fclusters%2FatlasSearch%2F%3Ccluster%3E) page displays.

</Tab>

<Tab name="Data Explorer">

- If it's not already displayed, select the organization that contains your project from the  Organizations menu in the navigation bar.

- If it's not already displayed, select your project from the Projects menu in the navigation bar.

- In the sidebar, click Data Explorer under the Database heading.

- Expand the database and select the collection.

- Click the Indexes tab for the collection.

- Click the Search and Vector Search link in the banner.

  The [Search & Vector Search](https://cloud.mongodb.com/go?l=https%3A%2F%2Fcloud.mongodb.com%2Fv2%2F%3Cproject%3E%23%2Fclusters%2FatlasSearch%2F%3Ccluster%3E%3Fdatabase%3Dsample_mflix%26collectionName%3Dusers) page displays.

</Tab>

</Tabs>

## Go to the Search Tester.

Click the Query button to the right of the index to query.

## View and edit the query syntax.

Click Edit Query to view a default query syntax sample in JSON (Javascript Object Notation) format.

## Run the following example queries on the `movies` collection.

If you created an index with a single synonym mapping definition, run the query from the following Simple Example tab. If you defined multiple synonym mappings in your index, you can run the queries from both of the following tabs.

The following queries:

- Exclude all fields except the `title` field.

- Add a field named `score`.

<Tabs>

<Tab name="Simple Example">

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

The following query searches the `title` field for `automobile` and uses the `transportSynonyms` synonym mapping definition to search for the synonyms of `automobile` that you configured in the `transport_synonyms` synonyms source collection.

```json
[
  {
    $search: {
      index: "synonyms-tutorial",
      text: {
        path: "title",
        query: "automobile",
        synonyms: "transportSynonyms"
      }
    }
  }
]
```

```
SCORE: 4.197734832763672  _id:  “573a13a9f29313caabd1f18a”
  fullplot: "While traveling to California for the dispute of the final race of the…"
  imdb: Object
  year: 2006
  ...
  title: "Cars"

SCORE: 3.8511905670166016  _id:  “573a1398f29313caabcea94c”
  plot: "A man must struggle to travel home for Thanksgiving with an obnoxious …"
  genres: Array
  runtime: 93
  ...
  title: "Planes, Trains, and Automobiles"

SCORE: 3.39473032951355  _id:  “573a1397f29313caabce5fb0”
  plot: "Car Wash is about a close-knit group of employees who one day have all…"
  genres: Array
  runtime: 97
  ...
  title: "Car Wash"

SCORE: 3.39473032951355  _id:  “573a1397f29313caabce7bd2”
  plot: "When the owner of a struggling used car lot is killed, it's up to the …"
  genres: Array
  runtime: 113
  ...
  title: "Used Cars"

SCORE: 3.39473032951355  _id:  “573a13a6f29313caabd18bfe”
  fullplot: "Gifted 18-year-old Meg has been abandoned by her father and neglected …"
  imdb: Object
  year: 2002
  ...
  title: "Blue Car"

SCORE: 3.39473032951355  _id:  “573a13c1f29313caabd64e3d”
  fullplot: "After Mater gets his best friend, star race car Lightning McQueen, a s…"
  imdb: Object
  year: 2011
  ...
  title: "Cars 2"

SCORE: 3.39473032951355  _id:  “573a13eaf29313caabdce62c”
  plot: "A rebellious teenager navigates his way through the juvenile court sys…"
  genres: Array
  runtime: 94
  ...
  title: "Stealing Cars"

SCORE: 3.39473032951355  _id:  “573a13f1f29313caabddc93f”
  plot: "A small town sheriff sets out to find the two kids who have taken his …"
  genres: Array
  runtime: 86
  ...
  title: "Cop Car"

SCORE: 2.8496146202087402  _id:  “573a1396f29313caabce5480”
  plot: "The small town of Paris, Australia deliberately causes car accidents, …"
  genres: Array
  runtime: 91
  ...
  title: "The Cars That Eat People"

SCORE: 2.8496146202087402  _id:  “573a139df29313caabcf9636”
  plot: "Military doctor General Klenski is arrested in Stalin's Russia in 1953…"
  genres: Array
  runtime: 137
  ...
  title: "Khrustalyov, My Car!"
```

The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

The query searches the `title` field for `boat` and uses the `transportSynonyms` synonym mapping definition to search for the synonyms of `boat` that you configured in the `transport_synonyms` synonyms source collection.

```json
[
  {
    $search: {
      index: "synonyms-tutorial",
      text: {
        path: "title",
        query: "boat",
        synonyms: "transportSynonyms"
      }
    }
  }
]
```

```
SCORE: 5.373150825500488  _id:  “573a13e9f29313caabdcd013”
  plot: "A fearless sea captain sails a ship through loopholes in international…"
  genres: Array
  runtime: 90
  ...
  title: "Vessel"

SCORE: 4.589139938354492  _id:  “573a13e8f29313caabdc9e72”
  countries: Array
  genres: Array
  runtime: 7
  ...
  title: "Boats"

SCORE: 4.3452959060668945  _id:  “573a1398f29313caabce90b6”
  plot: "In 1914, a luxury ship leaves Italy in order to scatter the ashes of a…"
  genres: Array
  runtime: 128
  ...
  title: "And the Ship Sails On"

SCORE: 4.3452959060668945  _id:  “573a139cf29313caabcf7c75”
  plot: "A young Pennsylvania man moves to Los Angeles to begin work for an amb…"
  genres: Array
  runtime: 90
  ...
  title: "Broken Vessels"

SCORE: 4.3452959060668945  _id:   “573a13f0f29313caabdda2dd”
  plot: "A young man struggling with the death of his parents meets an extrover…"
  genres: Array
  runtime: 80
  ...
  title: "Sailing to Paradise"

SCORE: 3.711261749267578  _id:  “573a1397f29313caabce8796”
  plot: "A Japanese photojournalist revisits Vietnam after the Liberation and l…"
  genres: Array
  runtime: 109
  ...
  title: "Boat People"

SCORE: 3.711261749267578  _id:  “573a13a6f29313caabd17a98”
  plot: "Two straight men mistakenly end up on a "gays only" cruise."
  genres: Array
  runtime: 94
  ...
  title: "Boat Trip"

SCORE: 3.1153182983398438  _id:  “573a1394f29313caabce036c”
  plot: "Three London gentlemen take vacation rowing down the Thames, encounter…"
  genres: Array
  runtime: 84
  ...
  title: "Three Men in a Boat"

SCORE: 3.1153182983398438  _id:  “573a1395f29313caabce2c28”
  plot: "After a series of misunderstandings, the head of an aerospace research…"
  genres: Array
  runtime: 110
  ...
  title: "The Glass Bottom Boat"

SCORE: 3.1153182983398438  _id:  “573a13c2f29313caabd68772”
  fullplot: "Jack is a shy and awkward man who drives a limo and lives an unassumin…"
  imdb: Object
  runtime: 2010
  ...
  title: "Jack Goes Boating"
```

The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

```json
{ "title" : "Vessel", "score" : 5.373150825500488 }
{ "title" : "Broken Vessels", "score" : 4.3452959060668945 }
```

MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

```json
{ "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
{ "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
```

MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

</Tab>

<Tab name="Advanced Example">

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

The query searches the `title` field for `automobile` and uses the `transportSynonyms` synonym mapping definition to search for the synonyms of `automobile` that you configured in the `transport_synonyms` synonyms source collection. Also, the query searches the `title` field for `attire` and uses the `attireSynonyms` synonym mapping definition to search for the synonyms of `attire` that you configured in the `attire_synonyms` synonyms source collection.

```json
[
  {
    $search: {
      "index": "synonyms-tutorial",
      "compound": {
        "should": [{
          "text": {
            "path": "title",
            "query": "automobile",
            "synonyms": "transportSynonyms"
          }
        },
        {
          "text": {
            "path": "title",
            "query": "attire",
            "synonyms": "attireSynonyms"
          }
        }]
      }
    }
  }
]
```

```
SCORE: 4.812004089355469  _id:  “573a139af29313caabcf003f”
  plot: "The Dress is a tale filled with sex, violence, comedy and drama as it …"
  genres: Array
  runtime: 103
  ...
  title: "The Dress"

SCORE: 4.197734832763672  _id:  “573a13a9f29313caabd1f18a”
  fullplot: "While traveling to California for the dispute of the final race of the…"
  imdb: Object
  year: 2006
  ...
  title: "Cars"

SCORE: 3.891493320465088  _id:  “573a1397f29313caabce77cd”
  plot: "A mysterious blonde woman kills one of a psychiatrist's patients, and …"
  genres: Array
  runtime: 105
  ...
  title: "Dressed to Kill"

SCORE: 3.891493320465088  _id:  “573a13bcf29313caabd57e07”
  fullplot: "Two things about Jane: she never says no to her friends (she's been a …"
  imdb Object
  year: 2008
  ...
  title: "27 Dresses"

SCORE: 3.8511905670166016  _id:  “573a1398f29313caabcea94c”
  plot: "A man must struggle to travel home for Thanksgiving with an obnoxious …"
  genres: Array
  runtime: 93
  ...
  title: "Planes, Trains, and Automobiles"

SCORE: 3.39473032951355  _id:  “573a1397f29313caabce5fb0”
  plot: "Car Wash is about a close-knit group of employees who one day have all…"
  genres: Array
  runtime: 97
  ...
  title: "Car Wash"

SCORE: 3.39473032951355  _id:  “573a1397f29313caabce7bd2”
  plot: "When the owner of a struggling used car lot is killed, it's up to the …"
  genres: Array
  runtime: 113
  ...
  title: "Used Cars"

SCORE: 3.39473032951355  _id:  “573a13a6f29313caabd18bfe”
  fullplot: "Gifted 18-year-old Meg has been abandoned by her father and neglected …"
  imdb: Object
  year: 2002
  ...
  title: "Blue Car"

SCORE: 3.39473032951355  _id:  “573a13c1f29313caabd64e3d”
  fullplot: "After Mater gets his best friend, star race car Lightning McQueen, a s…"
  imdb: Object
  year: 2011
  ...
  title: "Cars 2"

SCORE: 3.39473032951355  _id:  “573a13eaf29313caabdce62c”
  plot: "A rebellious teenager navigates his way through the juvenile court sys…"
  genres: Array
  runtime: 94
  ...
  title: "Stealing Cars"
```

The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

The query searches the `title` field for `boat` and uses the `transportSynonyms` synonym mapping definition to search for the synonyms of `boat` that you configured in the `transport_synonyms` synonyms source collection. Also, the query searches the `title` field for `hat` and uses the `attireSynonyms` synonym mapping definition to search for the synonyms of `hat` that you configured in the `attire_synonyms` synonyms source collection.

```json
[
  {
    $search: {
      index: "synonyms-tutorial",
      compound: {
        should: [{
          text: {
            path: "title",
            query: "boat",
            synonyms: "transportSynonyms"
          }
        },
        {
          text: {
            path: "title",
            query: "hat",
            synonyms: "attireSynonyms"
          }
        }]
      }
    }
  }
]
```

```
SCORE: 5.673145294189453  _id:  “573a1397f29313caabce6bed”
  plot: "Down-on-his-luck Hollywood producer Barry 'Dutch' Detweiler attempts t…"
  genres: Array
  runtime: 114
  ...
  title: "Fedora"

SCORE: 5.373150825500488  _id:  “573a13e9f29313caabdcd013”
  plot: "A fearless sea captain sails a ship through loopholes in international…"
  genres: Array
  runtime: 90
  ...
  title: "Vessel"

SCORE: 4.589139938354492  _id:  “573a13e8f29313caabdc9e72”
  countries: Array
  genres: Array
  runtime: 7
  ...
  title: "Boats"

SCORE: 4.3452959060668945  _id:  “573a1398f29313caabce90b6”
  plot: "In 1914, a luxury ship leaves Italy in order to scatter the ashes of a…"
  genres: Array
  runtime: 128
  ...
  title: "And the Ship Sails On"

SCORE: 4.3452959060668945  _id:  “573a139cf29313caabcf7c75”
  plot: "A young Pennsylvania man moves to Los Angeles to begin work for an amb…"
  genres: Array
  runtime: 90
  ...
  title: "Broken Vessels"

SCORE: 4.3452959060668945  _id:   “573a13f0f29313caabdda2dd”
  plot: "A young man struggling with the death of his parents meets an extrover…"
  genres: Array
  runtime: 80
  ...
  title: "Sailing to Paradise"

SCORE: 4.066137313842773  _id:  “573a1392f29313caabcdaae8”
  plot: "An American dancer comes to Britain and falls for a model whom he init…"
  genres: Array
  runtime: 101
  ...
  title: "Top Hat"

SCORE: 4.066137313842773  _id:  “573a1394f29313caabce05e8”
  plot: "A Korean War veteran's morphine addiction wreaks havoc upon his family…"
  genres: Array
  runtime: 109
  ...
  title: "A Hatful of Rain"

SCORE: 3.711261749267578  _id:  “573a1397f29313caabce8796”
  plot: "A Japanese photojournalist revisits Vietnam after the Liberation and l…"
  genres: Array
  runtime: 109
  ...
  title: "Boat People"

SCORE: 3.711261749267578  _id:  “573a13a6f29313caabd17a98”
  plot: "Two straight men mistakenly end up on a "gays only" cruise."
  genres: Array
  runtime: 94
  ...
  title: "Boat Trip"
```

The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

</Tab>

</Tabs>

## Expand your query results.

The Search Tester might not display all the fields in the documents it returns. To view all the fields, including the field that you specify in the query path, expand the document in the results.

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the C Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB C driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up the C project.

In your terminal, navigate to where you want to create your application, then run the following command to create a directory called `atlas-search-project` for this project:

```shell
# Create a new directory for the project
mkdir atlas-search-project && cd atlas-search-project
```

Add the C driver to your project by following the instructions in the [MongoDB C Driver documentation](https://www.mongodb.com/docs/languages/c/c-driver/current/get-started/).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```c
#include <bson/bson.h>
#include <mongoc/mongoc.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
    mongoc_client_t *client;
    mongoc_database_t *database;
    mongoc_collection_t *collection;
    bson_error_t error;
    bson_t *doc;
    bool ret;

    /* Initialize the MongoDB C driver */
    mongoc_init();

    /* Create a client connection to your MongoDB cluster */
    client = mongoc_client_new("<connection-string>");
    if (!client) {
        fprintf(stderr, "Failed to create client connection.\n");
        return EXIT_FAILURE;
    }

    /* Get a handle to the sample_mflix database */
    database = mongoc_client_get_database(client, "sample_mflix");

    /* Create the transport_synonyms collection */
    collection = mongoc_database_create_collection(database, "transport_synonyms", NULL, &error);
    if (!collection) {
        fprintf(stderr, "Failed to create transport_synonyms collection: %s\n", error.message);
        return EXIT_FAILURE;
    }

    /* Create and insert the first document - equivalent mapping */
    doc = BCON_NEW(
        "mappingType", BCON_UTF8("equivalent"),
        "synonyms", "[",
            BCON_UTF8("car"),
            BCON_UTF8("vehicle"),
            BCON_UTF8("automobile"),
        "]"
    );

    ret = mongoc_collection_insert_one(collection, doc, NULL, NULL, &error);
    if (!ret) {
        fprintf(stderr, "Failed to insert document: %s\n", error.message);
    }
    bson_destroy(doc);

    /* Create and insert the second document - explicit mapping */
    doc = BCON_NEW(
        "mappingType", BCON_UTF8("explicit"),
        "input", "[",
            BCON_UTF8("boat"),
        "]",
        "synonyms", "[",
            BCON_UTF8("boat"),
            BCON_UTF8("vessel"),
            BCON_UTF8("sail"),
        "]"
    );

    ret = mongoc_collection_insert_one(collection, doc, NULL, NULL, &error);
    if (!ret) {
        fprintf(stderr, "Failed to insert document: %s\n", error.message);
    }
    bson_destroy(doc);

    /* Release the collection handle */
    mongoc_collection_destroy(collection);

    /* Clean up resources */
    mongoc_database_destroy(database);
    mongoc_client_destroy(client);
    mongoc_cleanup();

    printf("Synonyms collections successfully created and populated.\n");

    return EXIT_SUCCESS;
}

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```c
#include <bson/bson.h>
#include <mongoc/mongoc.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
    mongoc_client_t *client;
    mongoc_database_t *database;
    mongoc_collection_t *collection;
    bson_error_t error;
    bson_t *doc;
    bool ret;

    /* Initialize the MongoDB C driver */
    mongoc_init();

    /* Create a client connection to your MongoDB cluster */
    client = mongoc_client_new("<connection-string>");
    if (!client) {
        fprintf(stderr, "Failed to create client connection.\n");
        return EXIT_FAILURE;
    }

    /* Get a handle to the sample_mflix database */
    database = mongoc_client_get_database(client, "sample_mflix");

    /* Create the transport_synonyms collection */
    collection = mongoc_database_create_collection(database, "transport_synonyms", NULL, &error);
    if (!collection) {
        fprintf(stderr, "Failed to create transport_synonyms collection: %s\n", error.message);
        return EXIT_FAILURE;
    }

    /* Create and insert the first transport document - equivalent mapping */
    doc = BCON_NEW(
        "mappingType", BCON_UTF8("equivalent"),
        "synonyms", "[",
            BCON_UTF8("car"),
            BCON_UTF8("vehicle"),
            BCON_UTF8("automobile"),
        "]"
    );

    ret = mongoc_collection_insert_one(collection, doc, NULL, NULL, &error);
    if (!ret) {
        fprintf(stderr, "Failed to insert document: %s\n", error.message);
    }
    bson_destroy(doc);

    /* Create and insert the second transport document - explicit mapping */
    doc = BCON_NEW(
        "mappingType", BCON_UTF8("explicit"),
        "input", "[",
            BCON_UTF8("boat"),
        "]",
        "synonyms", "[",
            BCON_UTF8("boat"),
            BCON_UTF8("vessel"),
            BCON_UTF8("sail"),
        "]"
    );

    ret = mongoc_collection_insert_one(collection, doc, NULL, NULL, &error);
    if (!ret) {
        fprintf(stderr, "Failed to insert document: %s\n", error.message);
    }
    bson_destroy(doc);

    /* Release the transport_synonyms collection handle */
    mongoc_collection_destroy(collection);

    /* Create the attire_synonyms collection */
    collection = mongoc_database_create_collection(database, "attire_synonyms", NULL, &error);
    if (!collection) {
        fprintf(stderr, "Failed to create attire_synonyms collection: %s\n", error.message);
        return EXIT_FAILURE;
    }

    /* Create and insert the first attire document - equivalent mapping */
    doc = BCON_NEW(
        "mappingType", BCON_UTF8("equivalent"),
        "synonyms", "[",
            BCON_UTF8("dress"),
            BCON_UTF8("apparel"),
            BCON_UTF8("attire"),
        "]"
    );

    ret = mongoc_collection_insert_one(collection, doc, NULL, NULL, &error);
    if (!ret) {
        fprintf(stderr, "Failed to insert document: %s\n", error.message);
    }
    bson_destroy(doc);

    /* Create and insert the second attire document - explicit mapping */
    doc = BCON_NEW(
        "mappingType", BCON_UTF8("explicit"),
        "input", "[",
            BCON_UTF8("hat"),
        "]",
        "synonyms", "[",
            BCON_UTF8("hat"),
            BCON_UTF8("fedora"),
            BCON_UTF8("headgear"),
        "]"
    );

    ret = mongoc_collection_insert_one(collection, doc, NULL, NULL, &error);
    if (!ret) {
        fprintf(stderr, "Failed to insert document: %s\n", error.message);
    }
    bson_destroy(doc);

    /* Release the attire_synonyms collection handle */
    mongoc_collection_destroy(collection);

    /* Clean up resources */
    mongoc_database_destroy(database);
    mongoc_client_destroy(client);
    mongoc_cleanup();

    printf("Synonyms collections successfully created and populated.\n");

    return EXIT_SUCCESS;
}

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Set up a CMake application

To configure your application, create a `CMakeLists.txt` file in your project directory. Then, add the following code to the file:

```txt
cmake_minimum_required(VERSION 3.11)
project(atlas-search-project LANGUAGES C)
add_executable (load.out synonyms.c)
find_package(mongoc <version> REQUIRED)
target_link_libraries(load.out mongoc::mongoc)
```

The preceding code performs the following actions:

- Configures a C project.

- Creates a `load.out` executable for your application.

- Finds and requires the C driver. Replace the `<version>` placeholder with your C driver version synonyms, such as `2.0.0`.

- Links the program to the `libmongoc` library.

In the sample `CMakeLists.txt` file, the `mongoc::mongoc` target points to either the static library or the shared library. The library type depends on which one is available and whichever type the user specifies in the `MONGOC_DEFAULT_IMPORTED_LIBRARY_TYPE` CMake configuration setting. If you don't set this value and both library types are available, `mongoc::mongoc` uses the static library.

You can use the `mongoc::static` target to explicitly use the static library or the `mongoc::shared` target to use the shared library.

### Create the index.

In your terminal, run the following commands to build and run this application:

```shell
cmake -S. -Bcmake-build
cmake --build cmake-build --target load.out
./cmake-build/load.out
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

The synonym mapping in a collection's [index](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-ref) specifies the synonyms source collection and the analyzer to use with the collection.

In this section, you create a MongoDB Search index that defines one or many synonym mappings for the `sample_mflix.movies` collection. The mapping definition in the index references the synonyms source collection that you created in the `sample_mflix` database.

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `create_index.c` file in your project directory, and copy and paste the following code into the file. The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```c
#include <mongoc/mongoc.h>
#include <stdlib.h>

int main (void)
{
    mongoc_client_t *client = NULL;
    mongoc_collection_t *collection = NULL;
    mongoc_database_t *database = NULL;
    bson_error_t error;
    bson_t cmd = BSON_INITIALIZER;
    bool ok = true;

    mongoc_init();

    // Connect to your Atlas deployment
    client = mongoc_client_new("<connection-string>");
    if (!client) {
        fprintf(stderr, "Failed to create a MongoDB client.\n");
        ok = false;
        goto cleanup;
    }

    // Access your database and collection
    database = mongoc_client_get_database(client, "sample_mflix");
    collection = mongoc_database_get_collection(database, "movies");

    // Specify the command and the new index
    const char *cmd_str = BSON_STR({
        "createSearchIndexes" : "movies",
        "indexes" : [ {
            "name" : "default",
            "definition" : {
                "mappings": {
                    "dynamic": false,
                    "fields": {
                        "title" : {
                            "analyzer": "lucene.english",
                            "type": "string"
                        }
                    }
                },
                "synonyms": [
                    {
                        "analyzer": "lucene.english",
                        "name": "transportSynonyms",
                        "source": {
                            "collection": "transport_synonyms"
                        }
                    }
                ]
            }
        } ]
    });

    // Convert your command to BSON
    if (!bson_init_from_json(&cmd, cmd_str, -1, &error)) {
        fprintf(stderr, "Failed to parse command: %s\n", error.message);
        ok = false;
        goto cleanup;
    }

    // Create the MongoDB Search index by running the command
    if (!mongoc_collection_command_simple (collection, &cmd, NULL, NULL, &error)) {
        fprintf(stderr, "Failed to run createSearchIndexes: %s\n", error.message);
        ok = false;
        goto cleanup;
    }
    printf ("Index created!\n");

cleanup:
   mongoc_collection_destroy (collection);
   mongoc_client_destroy (client);
   mongoc_database_destroy (database);
   bson_destroy (&cmd);
   mongoc_cleanup ();
   return ok ? EXIT_SUCCESS : EXIT_FAILURE;
}
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `create_index_multiple.c` file in your project directory, and copy and paste the following code into the file. The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```c
#include <mongoc/mongoc.h>
#include <stdlib.h>

int main (void)
{
    mongoc_client_t *client = NULL;
    mongoc_collection_t *collection = NULL;
    mongoc_database_t *database = NULL;
    bson_error_t error;
    bson_t cmd = BSON_INITIALIZER;
    bool ok = true;

    mongoc_init();

    // Connect to your Atlas deployment
    client = mongoc_client_new("<connection-string>");
    if (!client) {
        fprintf(stderr, "Failed to create a MongoDB client.\n");
        ok = false;
        goto cleanup;
    }

    // Access your database and collection
    database = mongoc_client_get_database(client, "sample_mflix");
    collection = mongoc_database_get_collection(database, "movies");

    // Specify the command and the new index
    const char *cmd_str = BSON_STR({
        "createSearchIndexes" : "movies",
        "indexes" : [ {
            "name" : "default",
            "definition" : {
                "mappings": {
                    "dynamic": false,
                    "fields": {
                        "title" : {
                            "analyzer": "lucene.english",
                            "type": "string"
                        }
                    }
                },
                "synonyms": [
                    {
                        "analyzer": "lucene.english",
                        "name": "transportSynonyms",
                        "source": {
                            "collection": "transport_synonyms"
                        }
                    },
                    {
                        "analyzer": "lucene.english",
                        "name": "attireSynonyms",
                        "source": {
                            "collection": "attire_synonyms"
                        }
                    }
                ]
            }
        } ]
    });

    // Convert your command to BSON
    if (!bson_init_from_json(&cmd, cmd_str, -1, &error)) {
        fprintf(stderr, "Failed to parse command: %s\n", error.message);
        ok = false;
        goto cleanup;
    }

    // Create the MongoDB Search index by running the command
    if (!mongoc_collection_command_simple (collection, &cmd, NULL, NULL, &error)) {
        fprintf(stderr, "Failed to run createSearchIndexes: %s\n", error.message);
        ok = false;
        goto cleanup;
    }
    printf ("Index created!\n");

cleanup:
   mongoc_collection_destroy (collection);
   mongoc_client_destroy (client);
   mongoc_database_destroy (database);
   bson_destroy (&cmd);
   mongoc_cleanup ();
   return ok ? EXIT_SUCCESS : EXIT_FAILURE;
}
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Set up a CMake application

To configure your application, create a `CMakeLists.txt` file in your project directory. Then, add the following code to the file:

```txt
cmake_minimum_required(VERSION 3.11)
project(atlas-search-index LANGUAGES C)
add_executable (index.out create_index.c)
find_package(mongoc <version> REQUIRED)
target_link_libraries(index.out mongoc::mongoc)

```

The preceding code performs the following actions:

- Configures a C project.

- Creates a `index.out` executable for your application.

- Finds and requires the C driver. Replace the `<version>` placeholder with your C driver version synonyms, such as `2.0.0`.

- Links the program to the `libmongoc` library.

In the sample `CMakeLists.txt` file, the `mongoc::mongoc` target points to either the static library or the shared library. The library type depends on which one is available and whichever type the user specifies in the `MONGOC_DEFAULT_IMPORTED_LIBRARY_TYPE` CMake configuration setting. If you don't set this value and both library types are available, `mongoc::mongoc` uses the static library.

You can use the `mongoc::static` target to explicitly use the static library or the `mongoc::shared` target to use the shared library.

### Create the index.

In your terminal, run the following commands to build and run this application:

```shell
cmake -S. -Bcmake-build
cmake --build cmake-build --target index.out
./cmake-build/index.out
```

```
Index created!
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms_equivalent_query.c`.

- Copy and paste the code example into the `synonyms_equivalent_query.c` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```c
  #include <mongoc/mongoc.h>
  #include <stdio.h>
  #include <stdlib.h>

  int main(int argc, char *argv[])
  {
      mongoc_client_t *client;
      mongoc_collection_t *collection;
      mongoc_cursor_t *cursor;
      bson_error_t error;
      const bson_t *doc;
      bson_t *pipeline;
      char *str;

      /* Initialize the MongoDB C Driver */
      mongoc_init();

      /* Connect to MongoDB */
      client = mongoc_client_new("<connection-string>");
      if (!client) {
          fprintf(stderr, "Failed to parse URI.\n");
          return EXIT_FAILURE;
      }

      /* Get a handle on the collection */
      collection = mongoc_client_get_collection(client, "sample_mflix", "movies");

      /* Create the pipeline */
      bson_t *search_stage = BCON_NEW(
          "$search", "{",
              "index", BCON_UTF8("default"),
              "text", "{",
                  "path", BCON_UTF8("title"),
                  "query", BCON_UTF8("automobile"),
                  "synonyms", BCON_UTF8("transportSynonyms"),
              "}",
          "}"
      );
      bson_t *limit_stage = BCON_NEW("$limit", BCON_INT32(10));
      bson_t *project_stage = BCON_NEW(
          "$project", "{",
              "title", BCON_INT32(1),
              "_id", BCON_INT32(0),
              "score", "{",
                  "$meta", BCON_UTF8("searchScore"),
              "}",
          "}"
      );

      /* Create the aggregation pipeline array properly */
      pipeline = bson_new();  // Create an empty array

      /* Append each stage directly to the pipeline array */
      char idx[16];
      const char *key;
      size_t idx_len;
      int i = 0;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, search_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, limit_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, project_stage);

      /* Set options (max time 5 seconds = 5000 ms) */
      mongoc_read_prefs_t *read_prefs = mongoc_read_prefs_new(MONGOC_READ_PRIMARY);
      mongoc_read_concern_t *read_concern = mongoc_read_concern_new();

      bson_t opts = BSON_INITIALIZER;
      bson_append_int32(&opts, "maxTimeMS", -1, 5000);

      /* Execute the aggregation */
      cursor = mongoc_collection_aggregate(
          collection,
          MONGOC_QUERY_NONE,
          pipeline,
          &opts,
          read_prefs
      );

      /* Display the results */
      while (mongoc_cursor_next(cursor, &doc)) {
          str = bson_as_canonical_extended_json(doc, NULL);
          printf("%s\n", str);
          bson_free(str);
      }

      /* Check if the cursor encountered any errors */
      if (mongoc_cursor_error(cursor, &error)) {
          fprintf(stderr, "Cursor Failure: %s\n", error.message);
          return EXIT_FAILURE;
      }

      /* Clean up */
      bson_destroy(search_stage);
      bson_destroy(limit_stage);
      bson_destroy(project_stage);
      bson_destroy(pipeline);
      bson_destroy(&opts);
      mongoc_read_prefs_destroy(read_prefs);
      mongoc_read_concern_destroy(read_concern);
      mongoc_cursor_destroy(cursor);
      mongoc_collection_destroy(collection);
      mongoc_client_destroy(client);
      mongoc_cleanup();

      return EXIT_SUCCESS;
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Set up a CMake application

  To configure your application, create a `CMakeLists.txt` file in your project directory. Then, add the following code to the file:

  ```txt
  cmake_minimum_required(VERSION 3.11)
  project(atlas-search-project LANGUAGES C)
  add_executable (query.out synonyms_equivalent_query.c)
  find_package(mongoc <version> REQUIRED)
  target_link_libraries(query.out mongoc::mongoc)
  ```

  The preceding code performs the following actions:

  - Configures a C project.

  - Creates a `query.out` executable for your application.

  - Finds and requires the C driver. Replace the `<version>` placeholder with your C driver version synonyms, such as `2.0.0`.

  - Links the program to the `libmongoc` library.

  In the sample `CMakeLists.txt` file, the `mongoc::mongoc` target points to either the static library or the shared library. The library type depends on which one is available and whichever type the user specifies in the `MONGOC_DEFAULT_IMPORTED_LIBRARY_TYPE` CMake configuration setting. If you don't set this value and both library types are available, `mongoc::mongoc` uses the static library.

  You can use the `mongoc::static` target to explicitly use the static library or the `mongoc::shared` target to use the shared library.

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  cmake -S. -Bcmake-build
  cmake --build cmake-build --target query.out
  ./cmake-build/query.out
  ```

  ```
  [{title Cars} {score 4.197734832763672}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  [{title Cop Car} {score 3.39473032951355}]
  [{title The Cars That Eat People} {score 2.8496146202087402}]
  [{title Khrustalyov, My Car!} {score 2.8496146202087402}]
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms_explicit_query.c`.

- Copy and paste the code example into the `synonyms_explicit_query.c` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```c
  #include <mongoc/mongoc.h>
  #include <stdio.h>
  #include <stdlib.h>

  int main(int argc, char *argv[])
  {
      mongoc_client_t *client;
      mongoc_collection_t *collection;
      mongoc_cursor_t *cursor;
      bson_error_t error;
      const bson_t *doc;
      bson_t *pipeline;
      char *str;

      /* Initialize the MongoDB C Driver */
      mongoc_init();

      /* Connect to MongoDB */
      client = mongoc_client_new("<connection-string>");
      if (!client) {
          fprintf(stderr, "Failed to parse URI.\n");
          return EXIT_FAILURE;
      }

      /* Get a handle on the collection */
      collection = mongoc_client_get_collection(client, "sample_mflix", "movies");

      /* Create the pipeline */
      pipeline = bson_new();
      bson_t *search_stage = BCON_NEW(
          "$search", "{",
              "index", BCON_UTF8("default"),
              "text", "{",
                  "path", BCON_UTF8("title"),
                  "query", BCON_UTF8("boat"),
                  "synonyms", BCON_UTF8("transportSynonyms"),
              "}",
          "}"
      );
      bson_t *limit_stage = BCON_NEW("$limit", BCON_INT32(10));
      bson_t *project_stage = BCON_NEW(
          "$project", "{",
              "title", BCON_INT32(1),
              "_id", BCON_INT32(0),
              "score", "{",
                  "$meta", BCON_UTF8("searchScore"),
              "}",
          "}"
      );

      /* Create the aggregation pipeline array properly */
      pipeline = bson_new();  // Create an empty array

      /* Append each stage directly to the pipeline array */
      char idx[16];
      const char *key;
      size_t idx_len;
      int i = 0;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, search_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, limit_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, project_stage);

      /* Set options (max time 5 seconds = 5000 ms) */
      mongoc_read_prefs_t *read_prefs = mongoc_read_prefs_new(MONGOC_READ_PRIMARY);
      mongoc_read_concern_t *read_concern = mongoc_read_concern_new();

      bson_t opts = BSON_INITIALIZER;
      bson_append_int32(&opts, "maxTimeMS", -1, 5000);

      /* Execute the aggregation */
      cursor = mongoc_collection_aggregate(
          collection,
          MONGOC_QUERY_NONE,
          pipeline,
          &opts,
          read_prefs
      );

      /* Display the results */
      while (mongoc_cursor_next(cursor, &doc)) {
          str = bson_as_canonical_extended_json(doc, NULL);
          printf("%s\n", str);
          bson_free(str);
      }

      /* Check if the cursor encountered any errors */
      if (mongoc_cursor_error(cursor, &error)) {
          fprintf(stderr, "Cursor Failure: %s\n", error.message);
          return EXIT_FAILURE;
      }

      /* Clean up */
      bson_destroy(search_stage);
      bson_destroy(limit_stage);
      bson_destroy(project_stage);
      bson_destroy(pipeline);
      bson_destroy(&opts);
      mongoc_read_prefs_destroy(read_prefs);
      mongoc_read_concern_destroy(read_concern);
      mongoc_cursor_destroy(cursor);
      mongoc_collection_destroy(collection);
      mongoc_client_destroy(client);
      mongoc_cleanup();

      return EXIT_SUCCESS;
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Set up a CMake application

  To configure your application, create a `CMakeLists.txt` file in your project directory. Then, add the following code to the file:

  ```txt
  cmake_minimum_required(VERSION 3.11)
  project(atlas-search-project LANGUAGES C)
  add_executable (query.out synonyms_explicit_query.c)
  find_package(mongoc <version> REQUIRED)
  target_link_libraries(query.out mongoc::mongoc)
  ```

  The preceding code performs the following actions:

  - Configures a C project.

  - Creates a `query.out` executable for your application.

  - Finds and requires the C driver. Replace the `<version>` placeholder with your C driver version synonyms, such as `2.0.0`.

  - Links the program to the `libmongoc` library.

  In the sample `CMakeLists.txt` file, the `mongoc::mongoc` target points to either the static library or the shared library. The library type depends on which one is available and whichever type the user specifies in the `MONGOC_DEFAULT_IMPORTED_LIBRARY_TYPE` CMake configuration setting. If you don't set this value and both library types are available, `mongoc::mongoc` uses the static library.

  You can use the `mongoc::static` target to explicitly use the static library or the `mongoc::shared` target to use the shared library.

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  cmake -S. -Bcmake-build
  cmake --build cmake-build --target query.out
  ./cmake-build/query.out
  ```

  ```
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  [{title Three Men in a Boat} {score 3.1153182983398438}]
  [{title The Glass Bottom Boat} {score 3.1153182983398438}]
  [{title Jack Goes Boating} {score 3.1153182983398438}]
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index that contains multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms_equivalent_query.c`.

- Copy and paste the code example into the `synonyms_equivalent_query.c` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```c
  #include <mongoc/mongoc.h>
  #include <stdio.h>
  #include <stdlib.h>

  int main(int argc, char *argv[])
  {
      mongoc_client_t *client;
      mongoc_collection_t *collection;
      mongoc_cursor_t *cursor;
      bson_error_t error;
      const bson_t *doc;
      bson_t *pipeline;
      char *str;

      /* Initialize the MongoDB C Driver */
      mongoc_init();

      /* Connect to MongoDB */
      client = mongoc_client_new("<connection-string>");
      if (!client) {
          fprintf(stderr, "Failed to parse URI.\n");
          return EXIT_FAILURE;
      }

      /* Get a handle on the collection */
      collection = mongoc_client_get_collection(client, "sample_mflix", "movies");

      /* Create the first text search clause for automobile */
      bson_t *text1 = BCON_NEW(
          "text", "{",
              "path", BCON_UTF8("title"),
              "query", BCON_UTF8("automobile"),
              "synonyms", BCON_UTF8("transportSynonyms"),
          "}"
      );

      /* Create the second text search clause for attire */
      bson_t *text2 = BCON_NEW(
          "text", "{",
              "path", BCON_UTF8("title"),
              "query", BCON_UTF8("attire"),
              "synonyms", BCON_UTF8("attireSynonyms"),
          "}"
      );

      /* Create the should array for compound search */
      bson_t *should_array = bson_new();
      char idx[16];
      const char *key;
      size_t idx_len;

      /* Add the text searches to the should array */
      idx_len = bson_uint32_to_string(0, &key, idx, sizeof(idx));
      bson_append_document(should_array, key, idx_len, text1);

      idx_len = bson_uint32_to_string(1, &key, idx, sizeof(idx));
      bson_append_document(should_array, key, idx_len, text2);

      /* Create the search stage directly with the should array */
      bson_t *search_stage = bson_new();
      bson_t search_doc, compound_doc;
      BSON_APPEND_DOCUMENT_BEGIN(search_stage, "$search", &search_doc);
      BSON_APPEND_UTF8(&search_doc, "index", "default");
      BSON_APPEND_DOCUMENT_BEGIN(&search_doc, "compound", &compound_doc);
      BSON_APPEND_ARRAY(&compound_doc, "should", should_array);
      bson_append_document_end(&search_doc, &compound_doc);
      bson_append_document_end(search_stage, &search_doc);

      /* Create the limit and project stages */
      bson_t *limit_stage = BCON_NEW("$limit", BCON_INT32(10));
      bson_t *project_stage = BCON_NEW(
          "$project", "{",
              "title", BCON_INT32(1),
              "_id", BCON_INT32(0),
              "score", "{",
                  "$meta", BCON_UTF8("searchScore"),
              "}",
          "}"
      );

      /* Create the aggregation pipeline array */
      pipeline = bson_new();
      int i = 0;

      /* Add each stage to the pipeline array */
      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, search_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, limit_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, project_stage);

      /* Set options (max time 5 seconds = 5000 ms) */
      mongoc_read_prefs_t *read_prefs = mongoc_read_prefs_new(MONGOC_READ_PRIMARY);
      mongoc_read_concern_t *read_concern = mongoc_read_concern_new();

      bson_t opts = BSON_INITIALIZER;
      bson_append_int32(&opts, "maxTimeMS", -1, 5000);

      /* Execute the aggregation */
      cursor = mongoc_collection_aggregate(
          collection,
          MONGOC_QUERY_NONE,
          pipeline,
          &opts,
          read_prefs
      );

      /* Display the results */
      while (mongoc_cursor_next(cursor, &doc)) {
          str = bson_as_canonical_extended_json(doc, NULL);
          printf("%s\n", str);
          bson_free(str);
      }

      /* Check if the cursor encountered any errors */
      if (mongoc_cursor_error(cursor, &error)) {
          fprintf(stderr, "Cursor Failure: %s\n", error.message);
          return EXIT_FAILURE;
      }

      /* Clean up */
      bson_destroy(text1);
      bson_destroy(text2);
      bson_destroy(should_array);
      bson_destroy(search_stage);
      bson_destroy(limit_stage);
      bson_destroy(project_stage);
      bson_destroy(pipeline);
      bson_destroy(&opts);
      mongoc_read_prefs_destroy(read_prefs);
      mongoc_read_concern_destroy(read_concern);
      mongoc_cursor_destroy(cursor);
      mongoc_collection_destroy(collection);
      mongoc_client_destroy(client);
      mongoc_cleanup();

      return EXIT_SUCCESS;
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Set up a CMake application

  To configure your application, create a `CMakeLists.txt` file in your project directory. Then, add the following code to the file:

  ```txt
  cmake_minimum_required(VERSION 3.11)
  project(atlas-search-project LANGUAGES C)
  add_executable (query.out synonyms_equivalent_query.c)
  find_package(mongoc <version> REQUIRED)
  target_link_libraries(query.out mongoc::mongoc)
  ```

  The preceding code performs the following actions:

  - Configures a C project.

  - Creates a `query.out` executable for your application.

  - Finds and requires the C driver. Replace the `<version>` placeholder with your C driver version synonyms, such as `2.0.0`.

  - Links the program to the `libmongoc` library.

  In the sample `CMakeLists.txt` file, the `mongoc::mongoc` target points to either the static library or the shared library. The library type depends on which one is available and whichever type the user specifies in the `MONGOC_DEFAULT_IMPORTED_LIBRARY_TYPE` CMake configuration setting. If you don't set this value and both library types are available, `mongoc::mongoc` uses the static library.

  You can use the `mongoc::static` target to explicitly use the static library or the `mongoc::shared` target to use the shared library.

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  cmake -S. -Bcmake-build
  cmake --build cmake-build --target query.out
  ./cmake-build/query.out
  ```

  ```none
  [{title The Dress} {score 4.812004089355469}]
  [{title Cars} {score 4.197734832763672}]
  [{title Dressed to Kill} {score 3.891493320465088}]
  [{title 27 Dresses} {score 3.891493320465088}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms_explicit_query.c`.

- Copy and paste the code example into the `synonyms_explicit_query.c` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```c
  #include <mongoc/mongoc.h>
  #include <stdio.h>
  #include <stdlib.h>

  int main(int argc, char *argv[])
  {
      mongoc_client_t *client;
      mongoc_collection_t *collection;
      mongoc_cursor_t *cursor;
      bson_error_t error;
      const bson_t *doc;
      bson_t *pipeline;
      char *str;

      /* Initialize the MongoDB C Driver */
      mongoc_init();

      /* Connect to MongoDB */
      client = mongoc_client_new("<connection-string>");
      if (!client) {
          fprintf(stderr, "Failed to parse URI.\n");
          return EXIT_FAILURE;
      }

      /* Get a handle on the collection */
      collection = mongoc_client_get_collection(client, "sample_mflix", "movies");

      /* Create the first text search clause for boat */
      bson_t *text1 = BCON_NEW(
          "text", "{",
              "path", BCON_UTF8("title"),
              "query", BCON_UTF8("boat"),
              "synonyms", BCON_UTF8("transportSynonyms"),
          "}"
      );

      /* Create the second text search clause for hat */
      bson_t *text2 = BCON_NEW(
          "text", "{",
              "path", BCON_UTF8("title"),
              "query", BCON_UTF8("hat"),
              "synonyms", BCON_UTF8("attireSynonyms"),
          "}"
      );

      /* Create the should array for compound search */
      bson_t *should_array = bson_new();
      char idx[16];
      const char *key;
      size_t idx_len;

      /* Add the text searches to the should array */
      idx_len = bson_uint32_to_string(0, &key, idx, sizeof(idx));
      bson_append_document(should_array, key, idx_len, text1);

      idx_len = bson_uint32_to_string(1, &key, idx, sizeof(idx));
      bson_append_document(should_array, key, idx_len, text2);

      /* Create the search stage directly with the should array */
      bson_t *search_stage = bson_new();
      bson_t search_doc, compound_doc;
      BSON_APPEND_DOCUMENT_BEGIN(search_stage, "$search", &search_doc);
      BSON_APPEND_UTF8(&search_doc, "index", "default_c");
      BSON_APPEND_DOCUMENT_BEGIN(&search_doc, "compound", &compound_doc);
      BSON_APPEND_ARRAY(&compound_doc, "should", should_array);
      bson_append_document_end(&search_doc, &compound_doc);
      bson_append_document_end(search_stage, &search_doc);

      /* Create the limit and project stages */
      bson_t *limit_stage = BCON_NEW("$limit", BCON_INT32(10));
      bson_t *project_stage = BCON_NEW(
          "$project", "{",
              "title", BCON_INT32(1),
              "_id", BCON_INT32(0),
              "score", "{",
                  "$meta", BCON_UTF8("searchScore"),
              "}",
          "}"
      );

      /* Create the aggregation pipeline array */
      pipeline = bson_new();
      int i = 0;

      /* Add each stage to the pipeline array */
      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, search_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, limit_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, project_stage);

      /* Set options (max time 5 seconds = 5000 ms) */
      mongoc_read_prefs_t *read_prefs = mongoc_read_prefs_new(MONGOC_READ_PRIMARY);
      mongoc_read_concern_t *read_concern = mongoc_read_concern_new();

      bson_t opts = BSON_INITIALIZER;
      bson_append_int32(&opts, "maxTimeMS", -1, 5000);

      /* Execute the aggregation */
      cursor = mongoc_collection_aggregate(
          collection,
          MONGOC_QUERY_NONE,
          pipeline,
          &opts,
          read_prefs
      );

      /* Display the results */
      while (mongoc_cursor_next(cursor, &doc)) {
          str = bson_as_canonical_extended_json(doc, NULL);
          printf("%s\n", str);
          bson_free(str);
      }

      /* Check if the cursor encountered any errors */
      if (mongoc_cursor_error(cursor, &error)) {
          fprintf(stderr, "Cursor Failure: %s\n", error.message);
          return EXIT_FAILURE;
      }

      /* Clean up */
      bson_destroy(text1);
      bson_destroy(text2);
      bson_destroy(should_array);
      bson_destroy(search_stage);
      bson_destroy(limit_stage);
      bson_destroy(project_stage);
      bson_destroy(pipeline);
      bson_destroy(&opts);
      mongoc_read_prefs_destroy(read_prefs);
      mongoc_read_concern_destroy(read_concern);
      mongoc_cursor_destroy(cursor);
      mongoc_collection_destroy(collection);
      mongoc_client_destroy(client);
      mongoc_cleanup();

      return EXIT_SUCCESS;
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Set up a CMake application

  To configure your application, create a `CMakeLists.txt` file in your project directory. Then, add the following code to the file:

  ```txt
  cmake_minimum_required(VERSION 3.11)
  project(atlas-search-project LANGUAGES C)
  add_executable (query.out synonyms_explicit_query.c)
  find_package(mongoc <version> REQUIRED)
  target_link_libraries(query.out mongoc::mongoc)
  ```

  The preceding code performs the following actions:

  - Configures a C project.

  - Creates a `query.out` executable for your application.

  - Finds and requires the C driver. Replace the `<version>` placeholder with your C driver version synonyms, such as `2.0.0`.

  - Links the program to the `libmongoc` library.

  In the sample `CMakeLists.txt` file, the `mongoc::mongoc` target points to either the static library or the shared library. The library type depends on which one is available and whichever type the user specifies in the `MONGOC_DEFAULT_IMPORTED_LIBRARY_TYPE` CMake configuration setting. If you don't set this value and both library types are available, `mongoc::mongoc` uses the static library.

  You can use the `mongoc::static` target to explicitly use the static library or the `mongoc::shared` target to use the shared library.

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  cmake -S. -Bcmake-build
  cmake --build cmake-build --target query.out
  ./cmake-build/query.out
  ```

  ```none
  [{title Fedora} {score 5.673145294189453}]
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Top Hat} {score 4.066137313842773}]
  [{title A Hatful of Rain} {score 4.066137313842773}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the C# Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB C# driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up and initialize the .NET/C# project.

In your terminal, navigate to where you want to create your application, then run the following command to create a directory called `atlas-search-project` and initialize your project in that directory:

```shell
# Create a new directory and initialize the project
mkdir atlas-search-project && cd atlas-search-project
dotnet new console

# Add the MongoDB .NET/C# Driver to your project
dotnet add package MongoDB.Driver
```

For more detailed installation instructions, see the [MongoDB C# Driver documentation](https://www.mongodb.com/docs/drivers/csharp/current/get-started/).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```csharp
using System;
using MongoDB.Bson;
using MongoDB.Driver;

namespace SynonymsTutorial
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                // Connection string to your MongoDB cluster
                string connectionString = "<connection-string>";

                // Create a MongoDB client
                var client = new MongoClient(connectionString);

                // Get the sample_mflix database
                var database = client.GetDatabase("sample_mflix");

                // Create the transport_synonyms collection
                try
                {
                    database.CreateCollection("transport_synonyms");
                }
                catch (MongoCommandException ex)
                {
                    // Collection may already exist, which is fine
                    Console.WriteLine($"Note: {ex.Message}");
                }

                var collection = database.GetCollection<BsonDocument>("transport_synonyms");

                // Create and insert the first document - equivalent mapping
                var doc1 = new BsonDocument
                {
                    { "mappingType", "equivalent" },
                    { "synonyms", new BsonArray { "car", "vehicle", "automobile" } }
                };

                collection.InsertOne(doc1);

                // Create and insert the second document - explicit mapping
                var doc2 = new BsonDocument
                {
                    { "mappingType", "explicit" },
                    { "input", new BsonArray { "boat" } },
                    { "synonyms", new BsonArray { "boat", "vessel", "sail" } }
                };

                collection.InsertOne(doc2);

                Console.WriteLine("Synonyms collections successfully created and populated.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Environment.Exit(1);
            }
        }
    }
}

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```csharp
using System;
using MongoDB.Bson;
using MongoDB.Driver;

namespace SynonymsTutorial
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                // Connection string to your MongoDB cluster
                string connectionString = "<connection-string>";

                // Create a MongoDB client
                var client = new MongoClient(connectionString);

                // Get the sample_mflix database
                var database = client.GetDatabase("sample_mflix");

                // Create the transport_synonyms collection
                try
                {
                    database.CreateCollection("transport_synonyms");
                }
                catch (MongoCommandException ex)
                {
                    // Collection may already exist, which is fine
                    Console.WriteLine($"Note: {ex.Message}");
                }

                var transportCollection = database.GetCollection<BsonDocument>("transport_synonyms");

                // Create and insert the first transport document - equivalent mapping
                var doc1 = new BsonDocument
                {
                    { "mappingType", "equivalent" },
                    { "synonyms", new BsonArray { "car", "vehicle", "automobile" } }
                };

                transportCollection.InsertOne(doc1);

                // Create and insert the second transport document - explicit mapping
                var doc2 = new BsonDocument
                {
                    { "mappingType", "explicit" },
                    { "input", new BsonArray { "boat" } },
                    { "synonyms", new BsonArray { "boat", "vessel", "sail" } }
                };

                transportCollection.InsertOne(doc2);

                // Create the attire_synonyms collection
                try
                {
                    database.CreateCollection("attire_synonyms");
                }
                catch (MongoCommandException ex)
                {
                    // Collection may already exist, which is fine
                    Console.WriteLine($"Note: {ex.Message}");
                }

                var attireCollection = database.GetCollection<BsonDocument>("attire_synonyms");

                // Create and insert the first attire document - equivalent mapping
                var doc3 = new BsonDocument
                {
                    { "mappingType", "equivalent" },
                    { "synonyms", new BsonArray { "dress", "apparel", "attire" } }
                };

                attireCollection.InsertOne(doc3);

                // Create and insert the second attire document - explicit mapping
                var doc4 = new BsonDocument
                {
                    { "mappingType", "explicit" },
                    { "input", new BsonArray { "hat" } },
                    { "synonyms", new BsonArray { "hat", "fedora", "headgear" } }
                };

                attireCollection.InsertOne(doc4);

                Console.WriteLine("Synonyms collections successfully created and populated.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Environment.Exit(1);
            }
        }
    }
}

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
dotnet run Program.cs
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Paste the following code into the `Program.cs` file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```csharp
using MongoDB.Bson;
using MongoDB.Driver;

// connect to your Atlas deployment
var uri = "<connection-string>";

var client = new MongoClient(uri);

var db = client.GetDatabase("sample_mflix");
var collection = db.GetCollection<BsonDocument>("movies");

// define your MongoDB Search index
var index = new CreateSearchIndexModel(
  "default", new BsonDocument
  {
    { "mappings", new BsonDocument
      {
        { "dynamic", false },
        { "fields", new BsonDocument
          {
            { "title", new BsonDocument
              {
                { "analyzer", "lucene.english" },
                { "type", "string" }
              }
            }
          }
        }
      }
    },
    { "synonyms", new BsonArray
      {
        new BsonDocument
        {
          { "analyzer", "lucene.english" },
          { "name", "transportSynonyms" },
          { "source", new BsonDocument
            {
              { "collection", "transport_synonyms" }
            }
          }
        }
      }
    }
  });

var result = collection.SearchIndexes.CreateOne(index);
Console.WriteLine($"New index name: {result}");
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Paste the following code into the `Program.cs` file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```csharp
using MongoDB.Bson;
using MongoDB.Driver;

// connect to your Atlas deployment
var uri = "<connection-string>";

var client = new MongoClient(uri);

var db = client.GetDatabase("sample_mflix");
var collection = db.GetCollection<BsonDocument>("movies");

// define your MongoDB Search index
var index = new CreateSearchIndexModel(
  "default", new BsonDocument
  {
    { "mappings", new BsonDocument
      {
        { "dynamic", false },
        { "fields", new BsonDocument
          {
            { "title", new BsonDocument
              {
                { "analyzer", "lucene.english" },
                { "type", "string" }
              }
            }
          }
        }
      }
    },
    { "synonyms", new BsonArray
      {
        new BsonDocument
        {
          { "analyzer", "lucene.english" },
          { "name", "transportSynonyms" },
          { "source", new BsonDocument
            {
              { "collection", "transport_synonyms" }
            }
          }
        },
        new BsonDocument
        {
          { "analyzer", "lucene.english" },
          { "name", "attireSynonyms" },
          { "source", new BsonDocument
            {
              { "collection", "attire_synonyms" }
            }
          }
        }
      }
    }
  });

var result = collection.SearchIndexes.CreateOne(index);
Console.WriteLine($"New index name: {result}");
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
dotnet run Program.cs
```

```
New index name: default
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `Program.cs`.

- Copy and paste the code example into the `Program.cs` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```csharp
  using MongoDB.Bson;
  using MongoDB.Driver;
  using System;
  using System.Threading.Tasks;

  class Program
  {
      static async Task Main(string[] args)
      {
          try
          {
              // Initialize the MongoDB C# driver
              var connectionString = "<connection-string>";
              var client = new MongoClient(connectionString);

              // Get a handle on the collection
              var database = client.GetDatabase("sample_mflix");
              var collection = database.GetCollection<BsonDocument>("movies");

              // Create pipeline stages
              var searchStage = new BsonDocument
              {
                  { "$search", new BsonDocument
                      {
                          { "index", "default" },
                          { "text", new BsonDocument
                              {
                                  { "path", "title" },
                                  { "query", "automobile" },
                                  { "synonyms", "transportSynonyms" }
                              }
                          }
                      }
                  }
              };

              var limitStage = new BsonDocument
              {
                  { "$limit", 10 }
              };

              var projectStage = new BsonDocument
              {
                  { "$project", new BsonDocument
                      {
                          { "title", 1 },
                          { "_id", 0 },
                          { "score", new BsonDocument
                              {
                                  { "$meta", "searchScore" }
                              }
                          }
                      }
                  }
              };

              // Create the aggregation pipeline
              var pipeline = new[] { searchStage, limitStage, projectStage };

              // Execute the aggregation
              using (var cursor = await collection.AggregateAsync<BsonDocument>(pipeline))
              {
                  // Display the results
                  await cursor.ForEachAsync(doc =>
                  {
                      Console.WriteLine(doc.ToJson());
                  });
              }
          }
          catch (Exception e)
          {
              Console.Error.WriteLine($"Error: {e.Message}");
              Environment.Exit(1);
          }
      }
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  dotnet run Program.cs
  ```

  ```
  [{title Cars} {score 4.197734832763672}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  [{title Cop Car} {score 3.39473032951355}]
  [{title The Cars That Eat People} {score 2.8496146202087402}]
  [{title Khrustalyov, My Car!} {score 2.8496146202087402}]
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `Program.cs`.

- Copy and paste the code example into the `Program.cs` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```csharp
  using MongoDB.Bson;
  using MongoDB.Driver;
  using System;
  using System.Threading.Tasks;

  class Program
  {
      static async Task Main(string[] args)
      {
          try
          {
              // Initialize the MongoDB C# driver
              var connectionString = "<connection-string>";
              var client = new MongoClient(connectionString);

              // Get a handle on the collection
              var database = client.GetDatabase("sample_mflix");
              var collection = database.GetCollection<BsonDocument>("movies");

              // Create pipeline stages
              var searchStage = new BsonDocument
              {
                  { "$search", new BsonDocument
                      {
                          { "index", "default" },
                          { "text", new BsonDocument
                              {
                                  { "path", "title" },
                                  { "query", "boat" },
                                  { "synonyms", "transportSynonyms" }
                              }
                          }
                      }
                  }
              };

              var limitStage = new BsonDocument
              {
                  { "$limit", 10 }
              };

              var projectStage = new BsonDocument
              {
                  { "$project", new BsonDocument
                      {
                          { "title", 1 },
                          { "_id", 0 },
                          { "score", new BsonDocument
                              {
                                  { "$meta", "searchScore" }
                              }
                          }
                      }
                  }
              };

              // Create the aggregation pipeline
              var pipeline = new[] { searchStage, limitStage, projectStage };

              // Set options (max time 5 seconds = 5000 ms)
              var options = new AggregateOptions
              {
                  MaxTime = TimeSpan.FromMilliseconds(5000)
              };

              // Execute the aggregation
              using (var cursor = await collection.AggregateAsync<BsonDocument>(pipeline, options))
              {
                  // Display the results
                  await cursor.ForEachAsync(doc =>
                  {
                      Console.WriteLine(doc.ToJson());
                  });
              }
          }
          catch (Exception e)
          {
              Console.Error.WriteLine($"Error: {e.Message}");
              Environment.Exit(1);
          }
      }
  }

  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  dotnet run Program.cs
  ```

  ```
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  [{title Three Men in a Boat} {score 3.1153182983398438}]
  [{title The Glass Bottom Boat} {score 3.1153182983398438}]
  [{title Jack Goes Boating} {score 3.1153182983398438}]
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index that contains multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `Program.cs`.

- Copy and paste the code example into the `Program.cs` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```csharp
  using MongoDB.Bson;
  using MongoDB.Driver;
  using System;
  using System.Threading.Tasks;

  class Program
  {
      static async Task Main(string[] args)
      {
          try
          {
              // Initialize the MongoDB C# driver
              var connectionString = "<connection-string>";
              var client = new MongoClient(connectionString);

              // Get a handle on the collection
              var database = client.GetDatabase("sample_mflix");
              var collection = database.GetCollection<BsonDocument>("movies");

              // Create the first text search clause for automobile
              var text1 = new BsonDocument
              {
                  { "text", new BsonDocument
                      {
                          { "path", "title" },
                          { "query", "automobile" },
                          { "synonyms", "transportSynonyms" }
                      }
                  }
              };

              // Create the second text search clause for attire
              var text2 = new BsonDocument
              {
                  { "text", new BsonDocument
                      {
                          { "path", "title" },
                          { "query", "attire" },
                          { "synonyms", "attireSynonyms" }
                      }
                  }
              };

              // Create the should array for compound search
              var shouldArray = new BsonArray
              {
                  text1,
                  text2
              };

              // Create the search stage with compound operator
              var searchStage = new BsonDocument
              {
                  { "$search", new BsonDocument
                      {
                          { "index", "default" },
                          { "compound", new BsonDocument
                              {
                                  { "should", shouldArray }
                              }
                          }
                      }
                  }
              };

              // Create the limit and project stages
              var limitStage = new BsonDocument
              {
                  { "$limit", 10 }
              };

              var projectStage = new BsonDocument
              {
                  { "$project", new BsonDocument
                      {
                          { "title", 1 },
                          { "_id", 0 },
                          { "score", new BsonDocument
                              {
                                  { "$meta", "searchScore" }
                              }
                          }
                      }
                  }
              };

              // Create the aggregation pipeline
              var pipeline = new[] { searchStage, limitStage, projectStage };

              // Set options (max time 5 seconds = 5000 ms)
              var options = new AggregateOptions
              {
                  MaxTime = TimeSpan.FromMilliseconds(5000)
              };

              // Execute the aggregation
              using (var cursor = await collection.AggregateAsync<BsonDocument>(pipeline, options))
              {
                  // Process and display the results
                  await cursor.ForEachAsync(doc =>
                  {
                      Console.WriteLine(doc.ToJson());
                  });
              }
          }
          catch (Exception e)
          {
              Console.Error.WriteLine($"Error: {e.Message}");
              Environment.Exit(1);
          }
      }
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  dotnet run Program.cs
  ```

  ```
  [{title The Dress} {score 4.812004089355469}]
  [{title Cars} {score 4.197734832763672}]
  [{title Dressed to Kill} {score 3.891493320465088}]
  [{title 27 Dresses} {score 3.891493320465088}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `Program.cs`.

- Copy and paste the code example into the `Program.cs` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```csharp
  using MongoDB.Bson;
  using MongoDB.Driver;
  using System;
  using System.Threading.Tasks;

  class Program
  {
      public static async Task<int> Main(string[] args)
      {
          try
          {
              // Connection string to your MongoDB deployment
              var connectionString = "<connection-string>";

              // Create a MongoDB client
              var client = new MongoClient(connectionString);

              // Get a handle on the database and collection
              var database = client.GetDatabase("sample_mflix");
              var collection = database.GetCollection<BsonDocument>("movies");

              // Create the first text search clause for boat
              var text1 = new BsonDocument
              {
                  { "text", new BsonDocument
                      {
                          { "path", "title" },
                          { "query", "boat" },
                          { "synonyms", "transportSynonyms" }
                      }
                  }
              };

              // Create the second text search clause for hat
              var text2 = new BsonDocument
              {
                  { "text", new BsonDocument
                      {
                          { "path", "title" },
                          { "query", "hat" },
                          { "synonyms", "attireSynonyms" }
                      }
                  }
              };

              // Create the search stage with compound operator using should array
              var shouldArray = new BsonArray { text1, text2 };

              // Create the search stage
              var searchStage = new BsonDocument
              {
                  { "$search", new BsonDocument
                      {
                          { "index", "default" },
                          { "compound", new BsonDocument
                              {
                                  { "should", shouldArray }
                              }
                          }
                      }
                  }
              };

              // Create the limit stage
              var limitStage = new BsonDocument
              {
                  { "$limit", 10 }
              };

              // Create the project stage
              var projectStage = new BsonDocument
              {
                  { "$project", new BsonDocument
                      {
                          { "title", 1 },
                          { "_id", 0 },
                          { "score", new BsonDocument
                              {
                                  { "$meta", "searchScore" }
                              }
                          }
                      }
                  }
              };

              // Create the aggregation pipeline
              var pipeline = new[] { searchStage, limitStage, projectStage };

              // Set options (max time 5 seconds = 5000 ms)
              var options = new AggregateOptions
              {
                  MaxTime = TimeSpan.FromMilliseconds(5000)
              };

              // Execute the aggregation
              using (var cursor = await collection.AggregateAsync<BsonDocument>(pipeline, options))
              {
                  // Process and display the results
                  await cursor.ForEachAsync(doc =>
                  {
                      Console.WriteLine(doc.ToJson());
                  });
              }

              return 0;
          }
          catch (Exception e)
          {
              Console.Error.WriteLine($"Error: {e.Message}");
              return 1;
          }
      }
  }
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  dotnet run Program.cs
  ```

  ```
  [{title Fedora} {score 5.673145294189453}]
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Top Hat} {score 4.066137313842773}]
  [{title A Hatful of Rain} {score 4.066137313842773}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the C++ Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB C++ driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up the C++ project.

In your terminal, navigate to where you want to create your application, then run the following command to create a directory called `atlas-search-project` for this project:

```shell
# Create a new directory for the project
mkdir atlas-search-project && cd atlas-search-project
```

For more detailed installation instructions, see the [MongoDB C++ Driver documentation](https://www.mongodb.com/docs/languages/cpp/cpp-driver/current/get-started/).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```cpp
#include <iostream>
#include <bsoncxx/builder/stream/document.hpp>
#include <bsoncxx/builder/stream/array.hpp>
#include <bsoncxx/json.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>
#include <mongocxx/exception/exception.hpp>

using bsoncxx::builder::stream::document;
using bsoncxx::builder::stream::array;
using bsoncxx::builder::stream::open_document;
using bsoncxx::builder::stream::close_document;
using bsoncxx::builder::stream::open_array;
using bsoncxx::builder::stream::close_array;
using bsoncxx::builder::stream::finalize;

int main() {
    try {
        // Initialize the MongoDB C++ driver
        mongocxx::instance instance{};

        // Create a MongoDB client
        const auto uri = mongocxx::uri{"<connection-string>"};
        mongocxx::client client{uri};

        // Get the sample_mflix database
        auto db = client["sample_mflix"];

        // Create the transport_synonyms collection
        try {
            db.create_collection("transport_synonyms");
        } catch (const mongocxx::exception& e) {
            // Collection may already exist, which is fine
            std::cerr << "Note: " << e.what() << std::endl;
        }

        auto collection = db["transport_synonyms"];

        // Create and insert the first document - equivalent mapping
        auto doc1 = document{}
            << "mappingType" << "equivalent"
            << "synonyms" << open_array
                << "car" << "vehicle" << "automobile"
            << close_array
            << finalize;

        collection.insert_one(doc1.view());

        // Create and insert the second document - explicit mapping
        auto doc2 = document{}
            << "mappingType" << "explicit"
            << "input" << open_array
                << "boat"
            << close_array
            << "synonyms" << open_array
                << "boat" << "vessel" << "sail"
            << close_array
            << finalize;

        collection.insert_one(doc2.view());

        std::cout << "Synonyms collections successfully created and populated." << std::endl;

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```cpp
#include <iostream>
#include <bsoncxx/builder/stream/document.hpp>
#include <bsoncxx/builder/stream/array.hpp>
#include <bsoncxx/json.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>
#include <mongocxx/exception/exception.hpp>

using bsoncxx::builder::stream::document;
using bsoncxx::builder::stream::array;
using bsoncxx::builder::stream::open_document;
using bsoncxx::builder::stream::close_document;
using bsoncxx::builder::stream::open_array;
using bsoncxx::builder::stream::close_array;
using bsoncxx::builder::stream::finalize;

int main() {
    try {
        // Initialize the MongoDB C++ driver
        mongocxx::instance instance{};

        // Create a MongoDB client
        const auto uri = mongocxx::uri{"<connection-string>"};
        mongocxx::client client{uri};

        // Get the sample_mflix database
        auto db = client["sample_mflix"];

        // Create the transport_synonyms collection
        try {
            db.create_collection("transport_synonyms");
        } catch (const mongocxx::exception& e) {
            // Collection may already exist, which is fine
            std::cerr << "Note: " << e.what() << std::endl;
        }

        auto transport_collection = db["transport_synonyms"];

        // Create and insert the first transport document - equivalent mapping
        auto doc1 = document{}
            << "mappingType" << "equivalent"
            << "synonyms" << open_array
                << "car" << "vehicle" << "automobile"
            << close_array
            << finalize;

        transport_collection.insert_one(doc1.view());

        // Create and insert the second transport document - explicit mapping
        auto doc2 = document{}
            << "mappingType" << "explicit"
            << "input" << open_array
                << "boat"
            << close_array
            << "synonyms" << open_array
                << "boat" << "vessel" << "sail"
            << close_array
            << finalize;

        transport_collection.insert_one(doc2.view());

        // Create the attire_synonyms collection
        try {
            db.create_collection("attire_synonyms");
        } catch (const mongocxx::exception& e) {
            // Collection may already exist, which is fine
            std::cerr << "Note: " << e.what() << std::endl;
        }

        auto attire_collection = db["attire_synonyms"];

        // Create and insert the first attire document - equivalent mapping
        auto doc3 = document{}
            << "mappingType" << "equivalent"
            << "synonyms" << open_array
                << "dress" << "apparel" << "attire"
            << close_array
            << finalize;

        attire_collection.insert_one(doc3.view());

        // Create and insert the second attire document - explicit mapping
        auto doc4 = document{}
            << "mappingType" << "explicit"
            << "input" << open_array
                << "hat"
            << close_array
            << "synonyms" << open_array
                << "hat" << "fedora" << "headgear"
            << close_array
            << finalize;

        attire_collection.insert_one(doc4.view());

        std::cout << "Synonyms collections successfully created and populated." << std::endl;

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
c++ --std=c++17 FileName.cpp $(pkg-config --cflags --libs libmongocxx) -o ./app.out
./app.out
```

```
Synonyms collections successfully created and populated.
```

MacOS users might see the following error after running the preceding commands:

```sh
dyld[54430]: Library not loaded: @rpath/libmongocxx._noabi.dylib
```

To resolve this error, use the `-Wl`,``-rpath`` linker option to set the `@rpath`, as shown in the following code:

```sh
c++ --std=c++17 FileName.cpp -Wl,-rpath,/usr/local/lib/ $(pkg-config --cflags --libs libmongocxx) -o ./app.out
./app.out
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `CreateIndex.cpp` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```cpp
#include <iostream>

#include <bsoncxx/builder/basic/document.hpp>
#include <bsoncxx/builder/basic/array.hpp>
#include <bsoncxx/json.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>

using bsoncxx::builder::basic::kvp;
using bsoncxx::builder::basic::make_document;
using bsoncxx::builder::basic::make_array;

int main(){

    mongocxx::instance instance;
    mongocxx::uri uri("<connection string>");
    mongocxx::client client(uri);

    auto db = client["sample_mflix"];
    auto collection = db["movies"];

    // instantiate a ``mongocxx::search_index_view`` on your collection
    auto siv = collection.search_indexes();

    {
        auto name = "default";
        auto definition = make_document(
            kvp("mappings", make_document(
                kvp("dynamic", false),
                kvp("fields", make_document(
                    kvp("title", make_document(
                        kvp("analyzer", "lucene.english"),
                        kvp("type", "string")
                    ))
                ))
            )),
            kvp("synonyms", make_array(
                make_document(
                    kvp("analyzer", "lucene.english"),
                    kvp("name", "transportSynonyms"),
                    kvp("source", make_document(
                        kvp("collection", "transport_synonyms")
                    ))
                )
            ))
        );

        auto model = mongocxx::search_index_model(name, definition.view());

        // Create the search index
        auto result = siv.create_one(model);
        std::cout << "New index name: " << result << std::endl;
    }
}
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `CreateIndexMultiple.cpp` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```cpp
#include <iostream>

#include <bsoncxx/builder/basic/document.hpp>
#include <bsoncxx/builder/basic/array.hpp>
#include <bsoncxx/json.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>

using bsoncxx::builder::basic::kvp;
using bsoncxx::builder::basic::make_document;
using bsoncxx::builder::basic::make_array;

int main(){

    mongocxx::instance instance;
    mongocxx::uri uri("<connection-string>");
    mongocxx::client client(uri);

    auto db = client["sample_mflix"];
    auto collection = db["movies"];

    // instantiate a ``mongocxx::search_index_view`` on your collection
    auto siv = collection.search_indexes();

    {
        auto name = "default";
        auto definition = make_document(
            kvp("mappings", make_document(
                kvp("dynamic", false),
                kvp("fields", make_document(
                    kvp("title", make_document(
                        kvp("analyzer", "lucene.english"),
                        kvp("type", "string")
                    ))
                ))
            )),
            kvp("synonyms", make_array(
                make_document(
                    kvp("analyzer", "lucene.english"),
                    kvp("name", "transportSynonyms"),
                    kvp("source", make_document(
                        kvp("collection", "transport_synonyms")
                    ))
                ),
                make_document(
                    kvp("analyzer", "lucene.english"),
                    kvp("name", "attireSynonyms"),
                    kvp("source", make_document(
                        kvp("collection", "attire_synonyms")
                    ))
                )
            ))
        );

        auto model = mongocxx::search_index_model(name, definition.view());

        // Create the search index
        auto result = siv.create_one(model);
        std::cout << "New index name: " << result << std::endl;
    }
}
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
c++ --std=c++17 FileName.cpp $(pkg-config --cflags --libs libmongocxx) -o ./app.out
./app.out
```

```
New index name: default
```

MacOS users might see the following error after running the preceding commands:

```sh
dyld[54430]: Library not loaded: @rpath/libmongocxx._noabi.dylib
```

To resolve this error, use the `-Wl`,``-rpath`` linker option to set the `@rpath`, as shown in the following code:

```sh
c++ --std=c++17 FileName.cpp -Wl,-rpath,/usr/local/lib/ $(pkg-config --cflags --libs libmongocxx) -o ./app.out
./app.out
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `SynonymsEquivalentQuery.cpp`.

- Copy and paste the code example into the `SynonymsEquivalentQuery.cpp` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```cpp
  #include <mongocxx/client.hpp>
  #include <mongocxx/instance.hpp>
  #include <mongocxx/uri.hpp>
  #include <mongocxx/pipeline.hpp>
  #include <bsoncxx/builder/stream/document.hpp>
  #include <bsoncxx/json.hpp>
  #include <iostream>
  #include <string>
  #include <vector>

  int main(int argc, char* argv[]) {
      try {
          // Initialize the MongoDB C++ driver
          mongocxx::instance instance{};

          // Connect to MongoDB
          mongocxx::uri uri("<connection-string>");
          mongocxx::client client(uri);

          // Get a handle on the collection
          mongocxx::database db = client["sample_mflix"];
          mongocxx::collection collection = db["movies"];

          // Build the aggregation pipeline using the stream builder
          using namespace bsoncxx::builder::stream;

          // Create pipeline stages
          auto search_stage = document{} << "$search" << open_document
              << "index" << "default"
              << "text" << open_document
                  << "path" << "title"
                  << "query" << "automobile"
                  << "synonyms" << "transportSynonyms"
              << close_document
          << close_document << finalize;

          auto limit_stage = document{} << "$limit" << 10 << finalize;

          auto project_stage = document{} << "$project" << open_document
              << "title" << 1
              << "_id" << 0
              << "score" << open_document
                  << "$meta" << "searchScore"
              << close_document
          << close_document << finalize;

          // Create the pipeline using mongocxx::pipeline
          mongocxx::pipeline pipeline;
          pipeline.append_stage(search_stage.view());
          pipeline.append_stage(limit_stage.view());
          pipeline.append_stage(project_stage.view());

          // Execute the aggregation
          mongocxx::cursor cursor = collection.aggregate(pipeline);

          // Process and display the results
          for (auto&& doc : cursor) {
              std::cout << bsoncxx::to_json(doc) << std::endl;
          }

          return EXIT_SUCCESS;

      } catch (const std::exception& e) {
          std::cerr << "Error: " << e.what() << std::endl;
          return EXIT_FAILURE;
      }
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  c++ --std=c++17 SynonymsEquivalentQuery.cpp $(pkg-config --cflags --libs libmongocxx) -o ./app.out
  ./app.out
  ```

  ```
  [{title Cars} {score 4.197734832763672}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  [{title Cop Car} {score 3.39473032951355}]
  [{title The Cars That Eat People} {score 2.8496146202087402}]
  [{title Khrustalyov, My Car!} {score 2.8496146202087402}]
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `SynonymsExplicitQuery.cpp`.

- Copy and paste the code example into the `SynonymsExplicitQuery.cpp` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```cpp
  #include <mongocxx/client.hpp>
  #include <mongocxx/instance.hpp>
  #include <mongocxx/uri.hpp>
  #include <mongocxx/pipeline.hpp>
  #include <bsoncxx/builder/stream/document.hpp>
  #include <bsoncxx/json.hpp>
  #include <iostream>
  #include <string>
  #include <vector>

  int main(int argc, char* argv[]) {
      try {
          // Initialize the MongoDB C++ driver
          mongocxx::instance instance{};

          // Connect to MongoDB
          mongocxx::uri uri("<connection-string>");
          mongocxx::client client(uri);

          // Get a handle on the collection
          mongocxx::database db = client["sample_mflix"];
          mongocxx::collection collection = db["movies"];

          // Build the aggregation pipeline using the stream builder
          using namespace bsoncxx::builder::stream;

          // Create pipeline stages
          auto search_stage = document{} << "$search" << open_document
              << "index" << "default"
              << "text" << open_document
                  << "path" << "title"
                  << "query" << "boat"
                  << "synonyms" << "transportSynonyms"
              << close_document
          << close_document << finalize;

          auto limit_stage = document{} << "$limit" << 10 << finalize;

          auto project_stage = document{} << "$project" << open_document
              << "title" << 1
              << "_id" << 0
              << "score" << open_document
                  << "$meta" << "searchScore"
              << close_document
          << close_document << finalize;

          // Create the pipeline using mongocxx::pipeline
          mongocxx::pipeline pipeline;
          pipeline.append_stage(search_stage.view());
          pipeline.append_stage(limit_stage.view());
          pipeline.append_stage(project_stage.view());

          // Execute the aggregation
          mongocxx::cursor cursor = collection.aggregate(pipeline);

          // Process and display the results
          for (auto&& doc : cursor) {
              std::cout << bsoncxx::to_json(doc) << std::endl;
          }

          return EXIT_SUCCESS;

      } catch (const std::exception& e) {
          std::cerr << "Error: " << e.what() << std::endl;
          return EXIT_FAILURE;
      }
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  c++ --std=c++17 SynonymsExplicitQuery.cpp $(pkg-config --cflags --libs libmongocxx) -o ./app.out
  ./app.out
  ```

  ```
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  [{title Three Men in a Boat} {score 3.1153182983398438}]
  [{title The Glass Bottom Boat} {score 3.1153182983398438}]
  [{title Jack Goes Boating} {score 3.1153182983398438}]
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

MacOS users might see the following error after running the preceding commands:

```sh
dyld[54430]: Library not loaded: @rpath/libmongocxx._noabi.dylib
```

To resolve this error, use the `-Wl`,``-rpath`` linker option to set the `@rpath`, as shown in the following code:

```sh
c++ --std=c++17 SynonymsEquivalentQuery.cpp -Wl,-rpath,/usr/local/lib/ $(pkg-config --cflags --libs libmongocxx) -o ./app.out
./app.out
```

## Run advanced MongoDB Search queries if you created the index that contains multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `SynonymsEquivalentQuery.cpp`.

- Copy and paste the code example into the `SynonymsEquivalentQuery.cpp` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```cpp
  #include <mongocxx/client.hpp>
  #include <mongocxx/instance.hpp>
  #include <mongocxx/uri.hpp>
  #include <mongocxx/pipeline.hpp>
  #include <bsoncxx/json.hpp>
  #include <bsoncxx/builder/stream/document.hpp>
  #include <bsoncxx/builder/stream/array.hpp>
  #include <bsoncxx/exception/exception.hpp>
  #include <iostream>
  #include <string>
  #include <chrono>

  int main(int argc, char* argv[]) {
      try {
          // Initialize the MongoDB C++ Driver
          mongocxx::instance instance{};

          // Connect to MongoDB
          mongocxx::uri uri("<connection-string>");
          mongocxx::client client(uri);

          // Get a handle on the collection
          mongocxx::database db = client["sample_mflix"];
          mongocxx::collection collection = db["movies"];

          // Use C++ stream builders for BSON documents
          using bsoncxx::builder::stream::document;
          using bsoncxx::builder::stream::open_document;
          using bsoncxx::builder::stream::close_document;
          using bsoncxx::builder::stream::open_array;
          using bsoncxx::builder::stream::close_array;
          using bsoncxx::builder::stream::finalize;
          using bsoncxx::builder::stream::array;

          // Create the first text search clause for automobile
          auto text1 = document{} << "text" << open_document
              << "path" << "title"
              << "query" << "automobile"
              << "synonyms" << "transportSynonyms"
              << close_document << finalize;

          // Create the second text search clause for attire
          auto text2 = document{} << "text" << open_document
              << "path" << "title"
              << "query" << "attire"
              << "synonyms" << "attireSynonyms"
              << close_document << finalize;

          // Create the should array for compound search
          auto should_array = array{}
              << text1.view()
              << text2.view()
              << finalize;

          // Create pipeline stages
          auto search_stage = document{} << "$search" << open_document
              << "index" << "default"
              << "compound" << open_document
                  << "should" << should_array.view()
              << close_document
          << close_document << finalize;

          auto limit_stage = document{} << "$limit" << 10 << finalize;

          auto project_stage = document{} << "$project" << open_document
              << "title" << 1
              << "_id" << 0
              << "score" << open_document
                  << "$meta" << "searchScore"
              << close_document
          << close_document << finalize;

          // Create the pipeline using mongocxx::pipeline
          mongocxx::pipeline pipeline;
          pipeline.append_stage(search_stage.view());
          pipeline.append_stage(limit_stage.view());
          pipeline.append_stage(project_stage.view());

          // Set options (max time 5 seconds = 5000 ms)
          mongocxx::options::aggregate options;
          options.max_time(std::chrono::milliseconds(5000));

          // Execute the aggregation
          mongocxx::cursor cursor = collection.aggregate(pipeline, options);

          // Process and display the results
          for (auto&& doc : cursor) {
              std::cout << bsoncxx::to_json(doc) << std::endl;
          }

          return EXIT_SUCCESS;

      } catch (const std::exception& e) {
          std::cerr << "Error: " << e.what() << std::endl;
          return EXIT_FAILURE;
      }
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  c++ --std=c++17 SynonymsEquivalentQuery.cpp $(pkg-config --cflags --libs libmongocxx) -o ./app.out
  ./app.out
  ```

  ```
  [{title The Dress} {score 4.812004089355469}]
  [{title Cars} {score 4.197734832763672}]
  [{title Dressed to Kill} {score 3.891493320465088}]
  [{title 27 Dresses} {score 3.891493320465088}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `SynonymsExplicitQuery.cpp`.

- Copy and paste the code example into the `SynonymsExplicitQuery.cpp` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```cpp
  #include <mongocxx/client.hpp>
  #include <mongocxx/instance.hpp>
  #include <mongocxx/uri.hpp>
  #include <mongocxx/pipeline.hpp>
  #include <mongocxx/options/aggregate.hpp>
  #include <bsoncxx/json.hpp>
  #include <bsoncxx/builder/stream/document.hpp>
  #include <bsoncxx/builder/stream/array.hpp>
  #include <bsoncxx/exception/exception.hpp>
  #include <iostream>
  #include <string>
  #include <chrono>

  int main(int argc, char* argv[]) {
      try {
          // Initialize the MongoDB C++ Driver
          mongocxx::instance instance{};

          // Connect to MongoDB
          mongocxx::uri uri("<connection-string>");
          mongocxx::client client(uri);

          // Get a handle on the collection
          mongocxx::database db = client["sample_mflix"];
          mongocxx::collection collection = db["movies"];

          // Use C++ stream builders for BSON documents
          using bsoncxx::builder::stream::document;
          using bsoncxx::builder::stream::open_document;
          using bsoncxx::builder::stream::close_document;
          using bsoncxx::builder::stream::open_array;
          using bsoncxx::builder::stream::close_array;
          using bsoncxx::builder::stream::finalize;

          // Create the first text search clause for boat
          auto text1 = document{} << "text" << open_document
              << "path" << "title"
              << "query" << "boat"
              << "synonyms" << "transportSynonyms"
              << close_document << finalize;

          // Create the second text search clause for hat
          auto text2 = document{} << "text" << open_document
              << "path" << "title"
              << "query" << "hat"
              << "synonyms" << "attireSynonyms"
              << close_document << finalize;

          // Create the search stage with compound operator using should array instead of must
          auto should_array = bsoncxx::builder::stream::array{}
              << text1.view()
              << text2.view()
              << finalize;

          // Create pipeline stages
          auto search_stage = document{} << "$search" << open_document
              << "index" << "default"
              << "compound" << open_document
                  << "should" << should_array.view()
              << close_document
          << close_document << finalize;

          auto limit_stage = document{} << "$limit" << 10 << finalize;

          auto project_stage = document{} << "$project" << open_document
              << "title" << 1
              << "_id" << 0
              << "score" << open_document
                  << "$meta" << "searchScore"
              << close_document
          << close_document << finalize;

          // Create the pipeline using mongocxx::pipeline
          mongocxx::pipeline pipeline;
          pipeline.append_stage(search_stage.view());
          pipeline.append_stage(limit_stage.view());
          pipeline.append_stage(project_stage.view());

          // Set options (max time 5 seconds = 5000 ms)
          mongocxx::options::aggregate options;
          options.max_time(std::chrono::milliseconds(5000));

          // Execute the aggregation
          mongocxx::cursor cursor = collection.aggregate(pipeline, options);

          // Process and display the results
          for (auto&& doc : cursor) {
              std::cout << bsoncxx::to_json(doc) << std::endl;
          }

          return EXIT_SUCCESS;

      } catch (const std::exception& e) {
          std::cerr << "Error: " << e.what() << std::endl;
          return EXIT_FAILURE;
      }
  }
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  c++ --std=c++17 SynonymsExplicitQuery.cpp $(pkg-config --cflags --libs libmongocxx) -o ./app.out
  ./app.out
  ```

  ```
  [{title Fedora} {score 5.673145294189453}]
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Top Hat} {score 4.066137313842773}]
  [{title A Hatful of Rain} {score 4.066137313842773}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

MacOS users might see the following error after running the preceding commands:

```sh
dyld[54430]: Library not loaded: @rpath/libmongocxx._noabi.dylib
```

To resolve this error, use the `-Wl`,``-rpath`` linker option to set the `@rpath`, as shown in the following code:

```sh
c++ --std=c++17 SynonymsExplicitQuery.cpp -Wl,-rpath,/usr/local/lib/ $(pkg-config --cflags --libs libmongocxx) -o ./app.out
./app.out
```

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the Go Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB Go driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up and initialize the Go module.

In your terminal, navigate to where you want to create your application, then run the following command to create a directory called `atlas-search-project` and initialize your project in that directory:

```shell
# Create a new directory and initialize the project
mkdir atlas-search-project && cd atlas-search-project
go mod init atlas-search-project

# Add the MongoDB Go Driver to your project
go get go.mongodb.org/mongo-driver/v2/mongo
```

For more detailed installation instructions, see the [MongoDB Go Driver documentation](https://www.mongodb.com/docs/drivers/go/current/get-started/#std-label-go-get-started).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

func main() {
	// Create a context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to MongoDB
	uri := "<connection-string>"
	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		if err = client.Disconnect(ctx); err != nil {
			log.Fatal(err)
		}
	}()

	// Check the connection
	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		log.Fatal(err)
	}

	// Get the sample_mflix database
	database := client.Database("sample_mflix")

	// Create the transport_synonyms collection
	err = database.CreateCollection(ctx, "transport_synonyms")
	if err != nil {
		// Collection may already exist, which is fine
		fmt.Printf("Note: %v\n", err)
	}

	// Get the collection
	collection := database.Collection("transport_synonyms")

	// Create and insert the first document - equivalent mapping
	doc1 := bson.D{
		{"mappingType", "equivalent"},
		{"synonyms", bson.A{"car", "vehicle", "automobile"}},
	}

	_, err = collection.InsertOne(ctx, doc1)
	if err != nil {
		log.Fatal(err)
	}

	// Create and insert the second document - explicit mapping
	doc2 := bson.D{
		{"mappingType", "explicit"},
		{"input", bson.A{"boat"}},
		{"synonyms", bson.A{"boat", "vessel", "sail"}},
	}

	_, err = collection.InsertOne(ctx, doc2)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Synonyms collections successfully created and populated.")
}
```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

func main() {
	// Create a context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to MongoDB
	uri := "<connection-string>"
	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		if err = client.Disconnect(ctx); err != nil {
			log.Fatal(err)
		}
	}()

	// Check the connection
	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		log.Fatal(err)
	}

	// Get the sample_mflix database
	database := client.Database("sample_mflix")

	// Create the transport_synonyms collection
	err = database.CreateCollection(ctx, "transport_synonyms")
	if err != nil {
		// Collection may already exist, which is fine
		fmt.Printf("Note: %v\n", err)
	}

	// Get the transport_synonyms collection
	transportCollection := database.Collection("transport_synonyms")

	// Create and insert the first transport document - equivalent mapping
	doc1 := bson.D{
		{"mappingType", "equivalent"},
		{"synonyms", bson.A{"car", "vehicle", "automobile"}},
	}

	_, err = transportCollection.InsertOne(ctx, doc1)
	if err != nil {
		log.Fatal(err)
	}

	// Create and insert the second transport document - explicit mapping
	doc2 := bson.D{
		{"mappingType", "explicit"},
		{"input", bson.A{"boat"}},
		{"synonyms", bson.A{"boat", "vessel", "sail"}},
	}

	_, err = transportCollection.InsertOne(ctx, doc2)
	if err != nil {
		log.Fatal(err)
	}

	// Create the attire_synonyms collection
	err = database.CreateCollection(ctx, "attire_synonyms")
	if err != nil {
		// Collection may already exist, which is fine
		fmt.Printf("Note: %v\n", err)
	}

	// Get the attire_synonyms collection
	attireCollection := database.Collection("attire_synonyms")

	// Create and insert the first attire document - equivalent mapping
	doc3 := bson.D{
		{"mappingType", "equivalent"},
		{"synonyms", bson.A{"dress", "apparel", "attire"}},
	}

	_, err = attireCollection.InsertOne(ctx, doc3)
	if err != nil {
		log.Fatal(err)
	}

	// Create and insert the second attire document - explicit mapping
	doc4 := bson.D{
		{"mappingType", "explicit"},
		{"input", bson.A{"hat"}},
		{"synonyms", bson.A{"hat", "fedora", "headgear"}},
	}

	_, err = attireCollection.InsertOne(ctx, doc4)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Synonyms collections successfully created and populated.")
}

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
go run file_name.go
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `create_index.go` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```go
package main

import (
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func main() {
	ctx := context.Background()
	uri := "<connection-string>"
	client, err := mongo.Connect(options.Client().
		ApplyURI(uri))
	if err != nil {
		panic(err)
	}

	defer func() {
		if err := client.Disconnect(context.TODO()); err != nil {
			panic(err)
		}
	}()

	coll := client.Database("sample_mflix").Collection("movies")
	const indexName = "default"
	opts := options.SearchIndexes().SetName(indexName).SetType("search")

	// Define the MongoDB Search index
	searchIndexModel := mongo.SearchIndexModel{
		Definition: bson.D{
			{"mappings", bson.D{
				{"dynamic", false},
				{"fields", bson.D{
					{"title", bson.D{
						{"analyzer", "lucene.english"},
						{"type", "string"},
					}},
				}},
			}},
			{"synonyms", bson.A{
				bson.D{
					{"analyzer", "lucene.english"},
					{"name", "transportSynonyms"},
					{"source", bson.D{
						{"collection", "transport_synonyms"},
					}},
				},
			}},
		},
		Options: opts,
	}

	// Create the index
	searchIndexName, err := coll.SearchIndexes().CreateOne(ctx, searchIndexModel)
	if err != nil {
		log.Fatalf("Failed to create the Atlas Search index: %v", err)
	}

	fmt.Println("New index name: " + searchIndexName)
}
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `create_index_multiple.go` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```go
package main

import (
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func main() {
	ctx := context.Background()
	uri := "<connection-string>"
	client, err := mongo.Connect(options.Client().
		ApplyURI(uri))
	if err != nil {
		panic(err)
	}

	defer func() {
		if err := client.Disconnect(context.TODO()); err != nil {
			panic(err)
		}
	}()

	coll := client.Database("sample_mflix").Collection("movies")
	const indexName = "default"
	opts := options.SearchIndexes().SetName(indexName).SetType("search")

	// Define the MongoDB Search index
	searchIndexModel := mongo.SearchIndexModel{
		Definition: bson.D{
			{"mappings", bson.D{
				{"dynamic", false},
				{"fields", bson.D{
					{"title", bson.D{
						{"analyzer", "lucene.english"},
						{"type", "string"},
					}},
				}},
			}},
			{"synonyms", bson.A{
				bson.D{
					{"analyzer", "lucene.english"},
					{"name", "transportSynonyms"},
					{"source", bson.D{
						{"collection", "transport_synonyms"},
					}},
				},
				bson.D{
					{"analyzer", "lucene.english"},
					{"name", "attireSynonyms"},
					{"source", bson.D{
						{"collection", "attire_synonyms"},
					}},
				},
			}},
		},
		Options: opts,
	}

	// Create the index
	searchIndexName, err := coll.SearchIndexes().CreateOne(ctx, searchIndexModel)
	if err != nil {
		log.Fatalf("Failed to create the Atlas Search index: %v", err)
	}

	fmt.Println("New index name: " + searchIndexName)
}
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
go run file_name.go
```

```
New index name: default
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms-equivalent-query.go`.

- Copy and paste the code example into the `synonyms-equivalent-query.go` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```go
  package main

  import (
  	"context"
  	"fmt"
  	"time"

  	"go.mongodb.org/mongo-driver/v2/bson"
  	"go.mongodb.org/mongo-driver/v2/mongo"
  	"go.mongodb.org/mongo-driver/v2/mongo/options"
  )

  // define structure of movies collection
  type MovieCollection struct {
  	title string `bson:"Title,omitempty"`
  }

  func main() {
  	var err error
  	// connect to the Atlas cluster
  	ctx := context.Background()
  	client, err := mongo.Connect(options.Client().ApplyURI("<connection-string>"))
  	if err != nil {
  		panic(err)
  	}
  	defer client.Disconnect(ctx)

  	// set namespace
  	collection := client.Database("sample_mflix").Collection("movies")

  	// define pipeline
  	searchStage := bson.D{{"$search", bson.D{{"index", "default"}, {"text", bson.D{{"path", "title"}, {"query", "automobile"}, {"synonyms", "transportSynonyms"}}}}}}
  	limitStage := bson.D{{"$limit", 10}}
  	projectStage := bson.D{{"$project", bson.D{{"title", 1}, {"_id", 0}, {"score", bson.D{{"$meta", "searchScore"}}}}}}

  	// specify the amount of time the operation can run on the server
  	opts := options.Aggregate()

  	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
  	defer cancel()

  	cursor, err := collection.Aggregate(ctx, mongo.Pipeline{searchStage, limitStage, projectStage}, opts)
  	if err != nil {
  		panic(err)
  	}

  	// print results
  	var results []bson.D
  	if err = cursor.All(ctx, &results); err != nil {
  		panic(err)
  	}
  	for _, result := range results {
  		fmt.Println(result)
  	}
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the following command to query your collection:

  ```sh
  go run synonyms-equivalent-query.go
  ```

  When you run `synonyms-equivalent-query.go`, the program prints the following documents to your terminal:

  ```none
  [{title Cars} {score 4.197734832763672}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  [{title Cop Car} {score 3.39473032951355}]
  [{title The Cars That Eat People} {score 2.8496146202087402}]
  [{title Khrustalyov, My Car!} {score 2.8496146202087402}]
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms-explicit-query.go`.

- Copy and paste the code example into the `synonyms-explicit-query.go` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```go
  package main

  import (
  	"context"
  	"fmt"
  	"time"

  	"go.mongodb.org/mongo-driver/v2/bson"
  	"go.mongodb.org/mongo-driver/v2/mongo"
  	"go.mongodb.org/mongo-driver/v2/mongo/options"
  )

  // define structure of movies collection
  type MovieCollection struct {
  	title string `bson:"Title,omitempty"`
  }

  func main() {
  	var err error
  	// connect to the Atlas cluster
  	ctx := context.Background()
  	client, err := mongo.Connect(options.Client().ApplyURI("<connection-string>"))
  	if err != nil {
  		panic(err)
  	}
  	defer client.Disconnect(ctx)
  	// set namespace
  	collection := client.Database("sample_mflix").Collection("movies")
  	// define pipeline
  	searchStage := bson.D{{"$search", bson.D{{"index", "default"}, {"text", bson.D{{"path", "title"}, {"query", "boat"}, {"synonyms", "transportSynonyms"}}}}}}
  	limitStage := bson.D{{"$limit", 10}}
  	projectStage := bson.D{{"$project", bson.D{{"title", 1}, {"_id", 0}, {"score", bson.D{{"$meta", "searchScore"}}}}}}
  	// specify the amount of time the operation can run on the server
  	opts := options.Aggregate()

  	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
  	defer cancel()

  	cursor, err := collection.Aggregate(ctx, mongo.Pipeline{searchStage, limitStage, projectStage}, opts)
  	if err != nil {
  		panic(err)
  	}
  	// print results
  	var results []bson.D
  	if err = cursor.All(ctx, &results); err != nil {
  		panic(err)
  	}
  	for _, result := range results {
  		fmt.Println(result)
  	}
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the following command to query your collection:

  ```bash
  go run synonyms-explicit-query.go
  ```

  ```none
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  [{title Three Men in a Boat} {score 3.1153182983398438}]
  [{title The Glass Bottom Boat} {score 3.1153182983398438}]
  [{title Jack Goes Boating} {score 3.1153182983398438}]
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index that contains multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms-equivalent-query.go`.

- Copy and paste the code example into the `synonyms-equivalent-query.go` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```go
  package main

  import (
  	"context"
  	"fmt"
  	"time"

  	"go.mongodb.org/mongo-driver/v2/bson"
  	"go.mongodb.org/mongo-driver/v2/mongo"
  	"go.mongodb.org/mongo-driver/v2/mongo/options"
  )

  // define structure of movies collection
  type MovieCollection struct {
  	title string `bson:"Title,omitempty"`
  }

  func main() {
  	var err error
  	// connect to the Atlas cluster
  	ctx := context.Background()
  	client, err := mongo.Connect(options.Client().ApplyURI("<connection-string>"))
  	if err != nil {
  		panic(err)
  	}
  	defer client.Disconnect(ctx)
  	// set namespace
  	collection := client.Database("sample_mflix").Collection("movies")
  	// define pipeline
  	searchStage := bson.D{{"$search", bson.M{
  		"index": "default",
  		"compound": bson.M{
  			"should": bson.A{
  				bson.M{
  					"text": bson.D{
  						{"path", "title"}, {"query", "automobile"}, {"synonyms", "transportSynonyms"},
  					},
  				},
  				bson.M{
  					"text": bson.D{
  						{"path", "title"}, {"query", "attire"}, {"synonyms", "attireSynonyms"},
  					},
  				},
  			},
  		},
  	}}}
  	limitStage := bson.D{{"$limit", 10}}
  	projectStage := bson.D{{"$project", bson.D{{"title", 1}, {"_id", 0}, {"score", bson.D{{"$meta", "searchScore"}}}}}}
  	// specify the amount of time the operation can run on the server
  	opts := options.Aggregate()

  	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
  	defer cancel()

  	// run pipeline
  	cursor, err := collection.Aggregate(ctx, mongo.Pipeline{searchStage, limitStage, projectStage}, opts)
  	if err != nil {
  		panic(err)
  	}
  	// print results
  	var results []bson.D
  	if err = cursor.All(ctx, &results); err != nil {
  		panic(err)
  	}
  	for _, result := range results {
  		fmt.Println(result)
  	}
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the following command to query your collection:

  ```bash
  go run synonyms-equivalent-query.go
  ```

  ```none
  [{title The Dress} {score 4.812004089355469}]
  [{title Cars} {score 4.197734832763672}]
  [{title Dressed to Kill} {score 3.891493320465088}]
  [{title 27 Dresses} {score 3.891493320465088}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms-explicit-query.go`.

- Copy and paste the code example into the `synonyms-explicit-query.go` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```go
  package main

  import (
  	"context"
  	"fmt"
  	"time"

  	"go.mongodb.org/mongo-driver/v2/bson"
  	"go.mongodb.org/mongo-driver/v2/mongo"
  	"go.mongodb.org/mongo-driver/v2/mongo/options"
  )

  // define structure of movies collection
  type MovieCollection struct {
  	title string `bson:"Title,omitempty"`
  }

  func main() {
  	var err error
  	// connect to the Atlas cluster
  	ctx := context.Background()
  	client, err := mongo.Connect(options.Client().ApplyURI("<connection-string>"))
  	if err != nil {
  		panic(err)
  	}
  	defer client.Disconnect(ctx)
  	// set namespace
  	collection := client.Database("sample_mflix").Collection("movies")
  	// define pipeline
  	searchStage := bson.D{{"$search", bson.M{
  		"index": "default",
  		"compound": bson.M{
  			"should": bson.A{
  				bson.M{
  					"text": bson.D{
  						{"path", "title"}, {"query", "boat"}, {"synonyms", "transportSynonyms"},
  					},
  				},
  				bson.M{
  					"text": bson.D{
  						{"path", "title"}, {"query", "hat"}, {"synonyms", "attireSynonyms"},
  					},
  				},
  			},
  		},
  	}}}
  	limitStage := bson.D{{"$limit", 10}}
  	projectStage := bson.D{{"$project", bson.D{{"title", 1}, {"_id", 0}, {"score", bson.D{{"$meta", "searchScore"}}}}}}
  	// specify the amount of time the operation can run on the server
  	opts := options.Aggregate()

  	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
  	defer cancel()

  	// run pipeline
  	cursor, err := collection.Aggregate(ctx, mongo.Pipeline{searchStage, limitStage, projectStage}, opts)
  	if err != nil {
  		panic(err)
  	}
  	// print results
  	var results []bson.D
  	if err = cursor.All(ctx, &results); err != nil {
  		panic(err)
  	}
  	for _, result := range results {
  		fmt.Println(result)
  	}
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the following command to query your collection:

  ```bash
  go run synonyms-explicit-query.go
  ```

  ```none
  [{title Fedora} {score 5.673145294189453}]
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Top Hat} {score 4.066137313842773}]
  [{title A Hatful of Rain} {score 4.066137313842773}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the Java Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB Java driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up your Java project with the MongoDB Java driver.

In your IDE, create a new [Maven](https://maven.apache.org/) or [Gradle](https://gradle.org/) project. Add the Bill of Materials (BOM) for MongoDB JVM artifacts to your project to organize dependency versions. The BOM simplifies dependency management by ensuring that you maintain consistent and compatible versions of dependencies, such as between the Java driver and the core driver library. Use the BOM to avoid version conflicts and simplify upgrades.

Select from the following **Maven** and **Gradle** tabs to view instructions for adding the BOM for each dependency manager:

<Tabs>

<Tab name="Maven">

Add the following code to the `dependencyManagement` list in your `pom.xml` file:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.mongodb</groupId>
            <artifactId>mongodb-driver-bom</artifactId>
            <version>5.5.1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

</Tab>

<Tab name="Gradle">

Add the following code to dependencies list in your `build.gradle` file:

```groovy
dependencies {
    implementation(platform("org.mongodb:mongodb-driver-bom:5.5.1"))
}
```

</Tab>

</Tabs>

To view a list of dependencies that the BOM manages, see the [mongodb-driver-bom dependency listing](https://mvnrepository.com/artifact/org.mongodb/mongodb-driver-bom/5.51) on the Maven Repository website.

After adding the BOM, select from the following **Maven** and **Gradle** tabs to view instructions for adding the MongoDB Java Sync Driver as a dependency in your project:

<Tabs>

<Tab name="Maven">

Add the following code to the `dependencies` array in your Maven project's `pom.xml` file:

```xml
<dependencies>
    <dependency>
      <groupId>org.mongodb</groupId>
      <artifactId>mongodb-driver-sync</artifactId>
      <version>4.11.1</version>
    </dependency>
</dependencies>

```

</Tab>

<Tab name="Gradle">

Add the following to the `dependencies` array in your Gradle project's `build.gradle` file:

```json
dependencies {
   // MongoDB Java Sync Driver v4.11.0 or later
   implementation 'org.mongodb:mongodb-driver-sync'
}

```

</Tab>

</Tabs>

Run your package manager to install the dependencies to your project.

For more detailed installation instructions and version compatibility, see the [MongoDB Java Driver documentation](https://www.mongodb.com/docs/drivers/java/sync/current/get-started/).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```java
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import com.mongodb.client.model.CreateCollectionOptions;

import java.util.Arrays;

public class TransportSynonyms {
    public static void main(String[] args) {
        // Connect to MongoDB
        String connectionString = "<connection-string>";
        try (MongoClient mongoClient = MongoClients.create(connectionString)) {

            // Get the sample_mflix database
            MongoDatabase database = mongoClient.getDatabase("sample_mflix");

            // Create the transport_synonyms collection
            try {
                database.createCollection("transport_synonyms", new CreateCollectionOptions());
            } catch (Exception e) {
                // Collection may already exist, which is fine
                System.out.println("Note: " + e.getMessage());
            }

            // Get the collection
            MongoCollection<Document> collection = database.getCollection("transport_synonyms");

            // Create and insert the first document - equivalent mapping
            Document doc1 = new Document("mappingType", "equivalent")
                    .append("synonyms", Arrays.asList("car", "vehicle", "automobile"));

            collection.insertOne(doc1);

            // Create and insert the second document - explicit mapping
            Document doc2 = new Document("mappingType", "explicit")
                    .append("input", Arrays.asList("boat"))
                    .append("synonyms", Arrays.asList("boat", "vessel", "sail"));

            collection.insertOne(doc2);

            System.out.println("Synonyms collections successfully created and populated.");
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }
}

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```java
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import com.mongodb.client.model.CreateCollectionOptions;

import java.util.Arrays;

public class MultipleSynonyms {
    public static void main(String[] args) {
        // Connect to MongoDB
        String connectionString = "<connection-string>";
        try (MongoClient mongoClient = MongoClients.create(connectionString)) {

            // Get the sample_mflix database
            MongoDatabase database = mongoClient.getDatabase("sample_mflix");

            // Create the transport_synonyms collection
            try {
                database.createCollection("transport_synonyms", new CreateCollectionOptions());
            } catch (Exception e) {
                // Collection may already exist, which is fine
                System.out.println("Note: " + e.getMessage());
            }

            // Get the transport_synonyms collection
            MongoCollection<Document> transportCollection = database.getCollection("transport_synonyms");

            // Create and insert the first transport document - equivalent mapping
            Document doc1 = new Document("mappingType", "equivalent")
                    .append("synonyms", Arrays.asList("car", "vehicle", "automobile"));

            transportCollection.insertOne(doc1);

            // Create and insert the second transport document - explicit mapping
            Document doc2 = new Document("mappingType", "explicit")
                    .append("input", Arrays.asList("boat"))
                    .append("synonyms", Arrays.asList("boat", "vessel", "sail"));

            transportCollection.insertOne(doc2);

            // Create the attire_synonyms collection
            try {
                database.createCollection("attire_synonyms", new CreateCollectionOptions());
            } catch (Exception e) {
                // Collection may already exist, which is fine
                System.out.println("Note: " + e.getMessage());
            }

            // Get the attire_synonyms collection
            MongoCollection<Document> attireCollection = database.getCollection("attire_synonyms");

            // Create and insert the first attire document - equivalent mapping
            Document doc3 = new Document("mappingType", "equivalent")
                    .append("synonyms", Arrays.asList("dress", "apparel", "attire"));

            attireCollection.insertOne(doc3);

            // Create and insert the second attire document - explicit mapping
            Document doc4 = new Document("mappingType", "explicit")
                    .append("input", Arrays.asList("hat"))
                    .append("synonyms", Arrays.asList("hat", "fedora", "headgear"));

            attireCollection.insertOne(doc4);

            System.out.println("Synonyms collections successfully created and populated.");
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }
}

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Compile and run the file to create the index.

Compile and run your application in your IDE or your shell.

```shell
javac FileName.java
java FileName
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `CreateIndex.java` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```java
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class CreateIndex {
    public static void main(String[] args) {
        // connect to your Atlas cluster
        String uri = "<connection-string>";

        try (MongoClient mongoClient = MongoClients.create(uri)) {
            // set namespace
            MongoDatabase database = mongoClient.getDatabase("sample_mflix");
            MongoCollection<Document> collection = database.getCollection("movies");
            String indexName = "default";

            Document titleField = new Document("analyzer", "lucene.english")
                    .append("type", "string");

            Document synonymSource = new Document("collection", "transport_synonyms");

            Document synonym = new Document("analyzer", "lucene.english")
                    .append("name", "transportSynonyms")
                    .append("source", synonymSource);

            Document index = new Document("mappings",
                    new Document("dynamic", false)
                            .append("fields", new Document("title", titleField)))
                    .append("synonyms", java.util.Arrays.asList(synonym));

            String result = collection.createSearchIndex(indexName, index);
            System.out.println("New index name: " + result);
        }
    }
}
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `CreateIndexMultiple.java` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```java
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class CreateIndexMultiple {
    public static void main(String[] args) {
        // connect to your Atlas cluster
        String uri = "<connection-string>";

        try (MongoClient mongoClient = MongoClients.create(uri)) {
            // set namespace
            MongoDatabase database = mongoClient.getDatabase("sample_mflix");
            MongoCollection<Document> collection = database.getCollection("movies");
            String indexName = "default";

            Document titleField = new Document("analyzer", "lucene.english")
                    .append("type", "string");

            Document transportSynonymSource = new Document("collection", "transport_synonyms");
            Document transportSynonym = new Document("analyzer", "lucene.english")
                    .append("name", "transportSynonyms")
                    .append("source", transportSynonymSource);

            Document attireSynonymSource = new Document("collection", "attire_synonyms");
            Document attireSynonym = new Document("analyzer", "lucene.english")
                    .append("name", "attireSynonyms")
                    .append("source", attireSynonymSource);

            Document index = new Document("mappings",
                    new Document("dynamic", false)
                            .append("fields", new Document("title", titleField)))
                    .append("synonyms", java.util.Arrays.asList(transportSynonym, attireSynonym));

            String result = collection.createSearchIndex(indexName, index);
            System.out.println("New index name: " + result);
        }
    }
}
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Compile and run the file to create the index.

Compile and run your application in your IDE or your shell.

```shell
javac FileName.java
java FileName
```

```
New index name: default
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Ensure that your `CLASSPATH` contains the following libraries.

<table>

<tr>
<td>
`junit`

</td>
<td>
4.11 or higher version

</td>
</tr>
<tr>
<td>
`mongodb-driver-sync`

</td>
<td>
4.3.0 or higher version

</td>
</tr>
<tr>
<td>
`slf4j-log4j12`

</td>
<td>
1.7.30 or higher version

</td>
</tr>
</table>

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `SynonymsEquivalentQuery.java`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```java
  import java.util.Arrays;
  import static com.mongodb.client.model.Filters.eq;
  import static com.mongodb.client.model.Aggregates.limit;
  import static com.mongodb.client.model.Aggregates.project;
  import static com.mongodb.client.model.Projections.excludeId;
  import static com.mongodb.client.model.Projections.fields;
  import static com.mongodb.client.model.Projections.include;
  import static com.mongodb.client.model.Projections.computed;
  import com.mongodb.client.MongoClient;
  import com.mongodb.client.MongoClients;
  import com.mongodb.client.MongoCollection;
  import com.mongodb.client.MongoDatabase;
  import org.bson.Document;

  public class SynonymsEquivalentQuery {
    public static void main( String[] args ) {
      // define query
      Document agg = new Document("$search",
          new Document("index", "default")
          .append("text",
              new Document("query", "automobile")
              .append("path","title")
              .append("synonyms", "transportSynonyms")));

      // specify connection
      String uri = "<connection-string>";

      // establish connection and set namespace
      try (MongoClient mongoClient = MongoClients.create(uri)) {
        MongoDatabase database = mongoClient.getDatabase("sample_mflix");
        MongoCollection<Document> collection = database.getCollection("movies");

  			// run query and print results
        collection.aggregate(Arrays.asList(agg,
          limit(10),
          project(fields(excludeId(), include("title"), computed("score", new Document("$meta", "searchScore")))))
        ).forEach(doc -> System.out.println(doc.toJson()));	
      }
    }
  }

  ```

  To run the sample code in your Maven environment, add the following above the import statements in your file.

  ```
  package com.mongodb.drivers;
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Compile and run `SynonymsEquivalentQuery.java` file.

  ```shell
  javac SynonymsEquivalentQuery.java
  java SynonymsEquivalentQuery
  ```

  ```json
  {"title": "Cars", "score": 4.197734832763672}
  {"title": "Planes, Trains & Automobiles", "score": 3.8511905670166016}
  {"title": "Car Wash", "score": 3.39473032951355}
  {"title": "Used Cars", "score": 3.39473032951355}
  {"title": "Blue Car", "score": 3.39473032951355}
  {"title": "Cars 2", "score": 3.39473032951355}
  {"title": "Stealing Cars", "score": 3.39473032951355}
  {"title": "Cop Car", "score": 3.39473032951355}
  {"title": "The Cars That Eat People", "score": 2.8496146202087402}
  {"title": "Khrustalyov, My Car!", "score": 2.8496146202087402}
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `SynonymsExplicitQuery.java`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```java
  import java.util.Arrays;
  import static com.mongodb.client.model.Filters.eq;
  import static com.mongodb.client.model.Aggregates.limit;
  import static com.mongodb.client.model.Aggregates.project;
  import static com.mongodb.client.model.Projections.excludeId;
  import static com.mongodb.client.model.Projections.fields;
  import static com.mongodb.client.model.Projections.include;
  import static com.mongodb.client.model.Projections.computed;
  import com.mongodb.client.MongoClient;
  import com.mongodb.client.MongoClients;
  import com.mongodb.client.MongoCollection;
  import com.mongodb.client.MongoDatabase;
  import org.bson.Document;

  public class SynonymsExplicitQuery {
    public static void main( String[] args ) {
      // define query
      Document agg = new Document("$search",
          new Document("index", "default")
          .append("text",
              new Document("query", "boat")
              .append("path","title")
              .append("synonyms", "transportSynonyms")));

      // specify connection
      String uri = "<connection-string>";

      // establish connection and set namespace
      try (MongoClient mongoClient = MongoClients.create(uri)) {
        MongoDatabase database = mongoClient.getDatabase("sample_mflix");
        MongoCollection<Document> collection = database.getCollection("movies");
  			
        // run query and print results
        collection.aggregate(Arrays.asList(agg,
          limit(10),
          project(fields(excludeId(), include("title"), computed("score", new Document("$meta", "searchScore")))))
        ).forEach(doc -> System.out.println(doc.toJson()));	
      }
    }
  }
  ```

  To run the sample code in your Maven environment, add the following above the import statements in your file.

  ```
  package com.mongodb.drivers;
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Compile and run `SynonymsExplicitQuery.java` file.

  ```shell
  javac SynonymsExplicitQuery.java
  java SynonymsExplicitQuery
  ```

  ```json
  {"title": "Vessel", "score": 5.373150825500488}
  {"title": "Boats", "score": 4.589139938354492}
  {"title": "And the Ship Sails On", "score": 4.3452959060668945}
  {"title": "Broken Vessels", "score": 4.3452959060668945}
  {"title": "Sailing to Paradise", "score": 4.3452959060668945}
  {"title": "Boat People", "score": 3.711261749267578}
  {"title": "Boat Trip", "score": 3.711261749267578}
  {"title": "Three Men in a Boat", "score": 3.1153182983398438}
  {"title": "The Glass Bottom Boat", "score": 3.1153182983398438}
  {"title": "Jack Goes Boating", "score": 3.1153182983398438}
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index with multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `SynonymsEquivalentQuery.java`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```java
  import java.util.Arrays;
  import static com.mongodb.client.model.Filters.eq;
  import static com.mongodb.client.model.Aggregates.limit;
  import static com.mongodb.client.model.Aggregates.project;
  import static com.mongodb.client.model.Projections.computed;
  import static com.mongodb.client.model.Projections.excludeId;
  import static com.mongodb.client.model.Projections.fields;
  import static com.mongodb.client.model.Projections.include;
  import com.mongodb.client.MongoClient;
  import com.mongodb.client.MongoClients;
  import com.mongodb.client.MongoCollection;
  import com.mongodb.client.MongoDatabase;
  import org.bson.Document;

  public class SynonymsEquivalentQuery {
  	public static void main( String[] args ) {
  		Document agg = new Document("$search",
  			new Document("index", "default")
  			.append("compound",
  				new Document("should", Arrays.asList(new Document("text",
                  	new Document("path", "title")
                  	.append("query", "automobile")
                  	.append("synonyms", "transportSynonyms")),
  			new Document("text",
  				new Document("path", "title")
  				.append("query", "attire")
                  .append("synonyms", "attireSynonyms"))))));
  		
  		String uri = "<connection-string>";

  		try (MongoClient mongoClient = MongoClients.create(uri)) {
  			MongoDatabase database = mongoClient.getDatabase("sample_mflix");
  			MongoCollection<Document> collection = database.getCollection("movies");
  					
  			collection.aggregate(Arrays.asList(agg,
  					limit(10),
  					project(fields(excludeId(), include("title"), computed("score", new Document("$meta", "searchScore")))))
  			).forEach(doc -> System.out.println(doc.toJson()));	
  		}
  	}
  }

  ```

  To run the sample code in your Maven environment, add the following above the import statements in your file.

  ```
  package com.mongodb.drivers;
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Compile and run `SynonymsEquivalentQuery.java` file.

  ```shell
  javac SynonymsEquivalentQuery.java
  java SynonymsEquivalentQuery
  ```

  ```json
  {"title": "The Dress", "score": 4.812004089355469}
  {"title": "Cars", "score": 4.197734832763672}
  {"title": "Dressed to Kill", "score": 3.891493320465088}
  {"title": "27 Dresses", "score": 3.891493320465088}
  {"title": "Planes, Trains & Automobiles", "score": 3.8511905670166016}
  {"title": "Car Wash", "score": 3.39473032951355}
  {"title": "Used Cars", "score": 3.39473032951355}
  {"title": "Blue Car", "score": 3.39473032951355}
  {"title": "Cars 2", "score": 3.39473032951355}
  {"title": "Stealing Cars", "score": 3.39473032951355}

  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `SynonymsExplicitQuery.java`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```java
  import java.util.Arrays;
  import static com.mongodb.client.model.Filters.eq;
  import static com.mongodb.client.model.Aggregates.limit;
  import static com.mongodb.client.model.Aggregates.project;
  import static com.mongodb.client.model.Projections.computed;
  import static com.mongodb.client.model.Projections.excludeId;
  import static com.mongodb.client.model.Projections.fields;
  import static com.mongodb.client.model.Projections.include;
  import com.mongodb.client.MongoClient;
  import com.mongodb.client.MongoClients;
  import com.mongodb.client.MongoCollection;
  import com.mongodb.client.MongoDatabase;
  import org.bson.Document;

  public class SynonymsExplicitQuery {
  	public static void main( String[] args ) {
  		Document agg = new Document("$search",
  			new Document("index", "default")
  			.append("compound",
  				new Document("should", Arrays.asList(new Document("text",
  					new Document("path", "title")
  					.append("query", "boat")
  					.append("synonyms", "transportSynonyms")),
  				new Document("text",
  					new Document("path", "title")
  					.append("query", "hat")
  					.append("synonyms", "attireSynonyms"))))));
  		
  		String uri = "<connection-string>";

  		try (MongoClient mongoClient = MongoClients.create(uri)) {
  			MongoDatabase database = mongoClient.getDatabase("sample_mflix");
  			MongoCollection<Document> collection = database.getCollection("movies");
  					
  			collection.aggregate(Arrays.asList(agg,
  					limit(10),
  					project(fields(excludeId(), include("title"), computed("score", new Document("$meta", "searchScore")))))
  			).forEach(doc -> System.out.println(doc.toJson()));	
  		}
  	}
  }

  ```

  To run the sample code in your Maven environment, add the following above the import statements in your file.

  ```
  package com.mongodb.drivers;
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Compile and run `SynonymsExplicitQuery.java` file.

  ```shell
  javac SynonymsExplicitQuery.java
  java SynonymsExplicitQuery
  ```

  ```json
  {"title": "Fedora", "score": 5.673145294189453}
  {"title": "Vessel", "score": 5.373150825500488}
  {"title": "Boats", "score": 4.589139938354492}
  {"title": "And the Ship Sails On", "score": 4.3452959060668945}
  {"title": "Broken Vessels", "score": 4.3452959060668945}
  {"title": "Sailing to Paradise", "score": 4.3452959060668945}
  {"title": "Top Hat", "score": 4.066137313842773}
  {"title": "A Hatful of Rain", "score": 4.066137313842773}
  {"title": "Boat People", "score": 3.711261749267578}
  {"title": "Boat Trip", "score": 3.711261749267578}

  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the Kotlin Coroutine Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB Java driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up your Kotlin project with the MongoDB Kotlin Coroutine driver.

In your IDE, create a new [Maven](https://maven.apache.org/) or [Gradle](https://gradle.org/) project. Add the Bill of Materials (BOM) for MongoDB JVM artifacts to your project to organize dependency versions. The BOM simplifies dependency management by ensuring that you maintain consistent and compatible versions of dependencies, such as between the Java driver and the core driver library. Use the BOM to avoid version conflicts and simplify upgrades.

Select from the following **Maven** and **Gradle** tabs to view instructions for adding the BOM for each dependency manager:

<Tabs>

<Tab name="Maven">

Add the following code to the `dependencyManagement` list in your `pom.xml` file:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.mongodb</groupId>
            <artifactId>mongodb-driver-bom</artifactId>
            <version>5.5.1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

</Tab>

<Tab name="Gradle">

Add the following code to the dependencies list in your `build.gradle` file:

```groovy
dependencies {
    implementation(platform("org.mongodb:mongodb-driver-bom:5.5.1"))
}
```

</Tab>

</Tabs>

To view a list of dependencies that the BOM manages, see the [mongodb-driver-bom dependency listing](https://mvnrepository.com/artifact/org.mongodb/mongodb-driver-bom/5.51) on the Maven Repository website.

After adding the BOM, select from the following **Maven** and **Gradle** tabs to view instructions for adding the MongoDB Kotlin Coroutine Driver as a dependency in your project:

<Tabs>

<Tab name="Maven">

Add the following code to the `dependencies` array in your Maven project's `pom.xml` file:

```xml
<dependencies>
    <dependency>
        <groupId>org.mongodb</groupId>
        <artifactId>mongodb-driver-kotlin-coroutine</artifactId>
    </dependency>
</dependencies>
```

</Tab>

<Tab name="Gradle">

Add the following to the `dependencies` array in your Gradle project's `build.gradle` file:

```json
dependencies {
    implementation("org.mongodb:mongodb-driver-kotlin-coroutine")
}
```

</Tab>

</Tabs>

Run your package manager to install the dependencies to your project.

For more detailed installation instructions and version compatibility, see the [MongoDB Kotlin Coroutine Driver documentation](https://www.mongodb.com/docs/drivers/kotlin/coroutine/current/quick-start/).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```kotlin
import com.mongodb.kotlin.client.coroutine.MongoClient
import kotlinx.coroutines.runBlocking
import org.bson.Document

fun main() = runBlocking {
    // Replace the placeholder with your MongoDB deployment's connection string
    val uri = "<connection-string>"

    val mongoClient = MongoClient.create(uri)
    val database = mongoClient.getDatabase("sample_mflix")

    try {
        // Create the transport_synonyms collection
        try {
            database.createCollection("transport_synonyms")
        } catch (e: Exception) {
            // Collection may already exist, which is fine
            println("Note: ${e.message}")
        }

        // Get the collection
        val collection = database.getCollection<Document>("transport_synonyms")

        // Create and insert the first document - equivalent mapping
        val doc1 = Document("mappingType", "equivalent")
            .append("synonyms", listOf("car", "vehicle", "automobile"))

        collection.insertOne(doc1)

        // Create and insert the second document - explicit mapping
        val doc2 = Document("mappingType", "explicit")
            .append("input", listOf("boat"))
            .append("synonyms", listOf("boat", "vessel", "sail"))

        collection.insertOne(doc2)

        println("Synonyms collections successfully created and populated.")
    } catch (e: Exception) {
        System.err.println("Error: ${e.message}")
        System.exit(1)
    } finally {
        mongoClient.close()
    }
}

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```kotlin
import com.mongodb.kotlin.client.coroutine.MongoClient
import kotlinx.coroutines.runBlocking
import org.bson.Document

fun main() = runBlocking {
    // Replace the placeholder with your MongoDB deployment's connection string
    val uri = "<connection-string>"

    val mongoClient = MongoClient.create(uri)
    val database = mongoClient.getDatabase("sample_mflix")

    try {
        // Create the transport_synonyms collection
        try {
            database.createCollection("transport_synonyms")
        } catch (e: Exception) {
            // Collection may already exist, which is fine
            println("Note: ${e.message}")
        }

        // Get the transport_synonyms collection
        val transportCollection = database.getCollection<Document>("transport_synonyms")

        // Create and insert the first transport document - equivalent mapping
        val doc1 = Document("mappingType", "equivalent")
            .append("synonyms", listOf("car", "vehicle", "automobile"))

        transportCollection.insertOne(doc1)

        // Create and insert the second transport document - explicit mapping
        val doc2 = Document("mappingType", "explicit")
            .append("input", listOf("boat"))
            .append("synonyms", listOf("boat", "vessel", "sail"))

        transportCollection.insertOne(doc2)

        // Create the attire_synonyms collection
        try {
            database.createCollection("attire_synonyms")
        } catch (e: Exception) {
            // Collection may already exist, which is fine
            println("Note: ${e.message}")
        }

        // Get the attire_synonyms collection
        val attireCollection = database.getCollection<Document>("attire_synonyms")

        // Create and insert the first attire document - equivalent mapping
        val doc3 = Document("mappingType", "equivalent")
            .append("synonyms", listOf("dress", "apparel", "attire"))

        attireCollection.insertOne(doc3)

        // Create and insert the second attire document - explicit mapping
        val doc4 = Document("mappingType", "explicit")
            .append("input", listOf("hat"))
            .append("synonyms", listOf("hat", "fedora", "headgear"))

        attireCollection.insertOne(doc4)

        println("Synonyms collections successfully created and populated.")
    } catch (e: Exception) {
        System.err.println("Error: ${e.message}")
        System.exit(1)
    } finally {
        mongoClient.close()
    }
}

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Compile and run the file to create the index.

Compile and run your application in your IDE or your shell.

```shell
kotlinc FileName.kt -include-runtime -d FileName.jar
java -jar FileName.jar
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `CreateIndex.kt` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```kotlin
import com.mongodb.kotlin.client.coroutine.MongoClient
import kotlinx.coroutines.runBlocking
import org.bson.Document

fun main() = runBlocking {
    // connect to your Atlas cluster
    val uri = "<connection-string>"

    val mongoClient = MongoClient.create(uri)
    try {
        // set namespace
        val database = mongoClient.getDatabase("sample_mflix")
        val collection = database.getCollection<Document>("movies")
        val indexName = "default"

        val titleField = Document("analyzer", "lucene.english")
            .append("type", "string")

        val synonymSource = Document("collection", "transport_synonyms")

        val synonym = Document("analyzer", "lucene.english")
            .append("name", "transportSynonyms")
            .append("source", synonymSource)

        val index = Document("mappings",
            Document("dynamic", false)
                .append("fields", Document("title", titleField)))
            .append("synonyms", listOf(synonym))

        val result = collection.createSearchIndex(indexName, index)
        println("New index name: $result")
    } finally {
        mongoClient.close()
    }
}
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `CreateIndexMultiple.kt` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```kotlin
import com.mongodb.kotlin.client.coroutine.MongoClient
import kotlinx.coroutines.runBlocking
import org.bson.Document

fun main() = runBlocking {
    // connect to your Atlas cluster
    val uri = "<connection-string>"

    val mongoClient = MongoClient.create(uri)
    try {
        // set namespace
        val database = mongoClient.getDatabase("sample_mflix")
        val collection = database.getCollection<Document>("movies")
        val indexName = "default"

        val titleField = Document("analyzer", "lucene.english")
            .append("type", "string")

        val transportSynonymSource = Document("collection", "transport_synonyms")
        val transportSynonym = Document("analyzer", "lucene.english")
            .append("name", "transportSynonyms")
            .append("source", transportSynonymSource)

        val attireSynonymSource = Document("collection", "attire_synonyms")
        val attireSynonym = Document("analyzer", "lucene.english")
            .append("name", "attireSynonyms")
            .append("source", attireSynonymSource)

        val index = Document("mappings",
            Document("dynamic", false)
                .append("fields", Document("title", titleField)))
            .append("synonyms", listOf(transportSynonym, attireSynonym))

        val result = collection.createSearchIndex(indexName, index)
        println("New index name: $result")
    } finally {
        mongoClient.close()
    }
}
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Compile and run the file to create the index.

Compile and run your application in your IDE or your shell.

```shell
kotlinc FileName.kt -include-runtime -d FileName.jar
java -jar FileName.jar
```

```
New index name: default
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Ensure that you add the following dependency to your project.

<table>

<tr>
<td>
`mongodb-driver-kotlin-coroutine`

</td>
<td>
4.10.0 or higher version

</td>
</tr>
</table>

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Prints the documents that match the query from the `AggregateFlow` instance.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `SynonymsEquivalentQuery.kt`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```kotlin
  import com.mongodb.client.model.Aggregates.limit
  import com.mongodb.client.model.Aggregates.project
  import com.mongodb.client.model.Projections.*
  import com.mongodb.kotlin.client.coroutine.MongoClient
  import kotlinx.coroutines.runBlocking
  import org.bson.Document

  fun main() {
      // establish connection and set namespace
      val uri = "<connection-string>"
      val mongoClient = MongoClient.create(uri)
      val database = mongoClient.getDatabase("sample_mflix")
      val collection = database.getCollection<Document>("movies")

      runBlocking {
          // define query
          val agg = Document(
              "\$search",
              Document("index", "default")
                  .append(
                      "text",
                      Document("query", "automobile")
                          .append("path", "title")
                          .append("synonyms", "transportSynonyms")
                  )
          )

          // run query and print results
          val resultsFlow = collection.aggregate<Document>(
              listOf(
                  agg,
                  limit(10),
                  project(fields(
                      excludeId(),
                      include("title"),
                      computed("score", Document("\$meta", "searchScore"))
                  ))
              )
          )
          resultsFlow.collect { println(it) }
      }
      mongoClient.close()
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the `SynonymsEquivalentQuery.kt` file.

  When you run the `SynonymsEquivalentQuery.kt` program in your IDE, it prints the following documents:

  ```none
  Document{{title=Cars, score=4.140600204467773}}
  Document{{title=Planes, Trains & Automobiles, score=3.8122920989990234}}
  Document{{title=Blue Car, score=3.348478317260742}}
  Document{{title=Used Cars, score=3.348478317260742}}
  Document{{title=Cars 2, score=3.348478317260742}}
  Document{{title=Stealing Cars, score=3.348478317260742}}
  Document{{title=Cop Car, score=3.348478317260742}}
  Document{{title=Car Wash, score=3.348478317260742}}
  Document{{title=The Cars That Eat People, score=2.810762405395508}}
  Document{{title=Revenge of the Electric Car, score=2.810762405395508}}
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `SynonymsExplicitQuery.kt`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```kotlin
  import com.mongodb.client.model.Aggregates.limit
  import com.mongodb.client.model.Aggregates.project
  import com.mongodb.client.model.Projections.*
  import com.mongodb.kotlin.client.coroutine.MongoClient
  import kotlinx.coroutines.runBlocking
  import org.bson.Document

  fun main() {
      // establish connection and set namespace
      val uri = "<connection-string>"
      val mongoClient = MongoClient.create(uri)
      val database = mongoClient.getDatabase("sample_mflix")
      val collection = database.getCollection<Document>("movies")

      runBlocking {
          // define query
          val agg = Document(
              "\$search",
              Document("index", "default")
                  .append(
                      "text",
                      Document("query", "boat")
                          .append("path", "title")
                          .append("synonyms", "transportSynonyms")
                  )
          )

          // run query and print results
          val resultsFlow = collection.aggregate<Document>(
              listOf(
                  agg,
                  limit(10),
                  project(fields(
                      excludeId(),
                      include("title"),
                      computed("score", Document("\$meta", "searchScore"))
                  ))
              )
          )
          resultsFlow.collect { println(it) }
      }
      mongoClient.close()
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the `SynonymsExplicitQuery.kt` file.

  When you run the `SynonymsExplicitQuery.kt` program in your IDE, it prints the following documents:

  ```none
  Document{{title=Vessel, score=5.3159894943237305}}
  Document{{title=Boats, score=4.597315311431885}}
  Document{{title=Sailing to Paradise, score=4.299008369445801}}
  Document{{title=And the Ship Sails On, score=4.299008369445801}}
  Document{{title=Broken Vessels, score=4.299008369445801}}
  Document{{title=Boat Trip, score=3.717820644378662}}
  Document{{title=Boat People, score=3.717820644378662}}
  Document{{title=Jack Goes Boating, score=3.1207938194274902}}
  Document{{title=The Glass Bottom Boat, score=3.1207938194274902}}
  Document{{title=Raspberry Boat Refugee, score=3.1207938194274902}}
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index with multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Prints the documents that match the query from the `AggregateFlow` instance.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `SynonymsEquivalentQuery.kt`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```kotlin
  import com.mongodb.client.model.Aggregates.limit
  import com.mongodb.client.model.Aggregates.project
  import com.mongodb.client.model.Projections.*
  import com.mongodb.kotlin.client.coroutine.MongoClient
  import kotlinx.coroutines.runBlocking
  import org.bson.Document

  fun main() {
      // establish connection and set namespace
      val uri = "<connection-string>"
      val mongoClient = MongoClient.create(uri)
      val database = mongoClient.getDatabase("sample_mflix")
      val collection = database.getCollection<Document>("movies")

      runBlocking {
          // define query
          val agg = Document(
              "\$search",
              Document("index", "default")
                  .append(
                      "compound",
                      Document(
                          "should", listOf(
                              Document(
                                  "text",
                                  Document("path", "title")
                                      .append("query", "automobile")
                                      .append("synonyms", "transportSynonyms")
                              ),
                              Document(
                                  "text",
                                  Document("path", "title")
                                      .append("query", "attire")
                                      .append("synonyms", "attireSynonyms")
                              )
                          )
                      )
                  )
          )

          // run query and print results
          val resultsFlow = collection.aggregate<Document>(
              listOf(
                  agg,
                  limit(10),
                  project(fields(
                      excludeId(),
                      include("title"),
                      computed("score", Document("\$meta", "searchScore"))
                  ))
              )
          )
          resultsFlow.collect { println(it) }
      }
      mongoClient.close()
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the `SynonymsEquivalentQuery.kt` file.

  When you run the `SynonymsEquivalentQuery.kt` program in your IDE, it prints the following documents:

  ```none
  Document{{title=The Dress, score=4.852960586547852}}
  Document{{title=Cars, score=4.140600204467773}}
  Document{{title=27 Dresses, score=3.9245595932006836}}
  Document{{title=Planes, Trains & Automobiles, score=3.8122920989990234}}
  Document{{title=Car Wash, score=3.348478317260742}}
  Document{{title=Used Cars, score=3.348478317260742}}
  Document{{title=Blue Car, score=3.348478317260742}}
  Document{{title=Cars 2, score=3.348478317260742}}
  Document{{title=Stealing Cars, score=3.348478317260742}}
  Document{{title=Cop Car, score=3.348478317260742}}
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `SynonymsExplicitQuery.kt`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```kotlin
  import com.mongodb.client.model.Aggregates.limit
  import com.mongodb.client.model.Aggregates.project
  import com.mongodb.client.model.Projections.*
  import com.mongodb.kotlin.client.coroutine.MongoClient
  import kotlinx.coroutines.runBlocking
  import org.bson.Document

  fun main() {
      // establish connection and set namespace
      val uri = "<connection-string>"
      val mongoClient = MongoClient.create(uri)
      val database = mongoClient.getDatabase("sample_mflix")
      val collection = database.getCollection<Document>("movies")

      runBlocking {
          // define query
          val agg = Document(
              "\$search",
              Document("index", "default")
                  .append(
                      "compound",
                      Document(
                          "should", listOf(
                              Document(
                                  "text",
                                  Document("path", "title")
                                      .append("query", "boat")
                                      .append("synonyms", "transportSynonyms")
                              ),
                              Document(
                                  "text",
                                  Document("path", "title")
                                      .append("query", "hat")
                                      .append("synonyms", "attireSynonyms")
                              )
                          )
                      )
                  )
          )

          // run query and print results
          val resultsFlow = collection.aggregate<Document>(
              listOf(
                  agg,
                  limit(10),
                  project(fields(
                      excludeId(),
                      include("title"),
                      computed("score", Document("\$meta", "searchScore"))
                  ))
              )
          )

          resultsFlow.collect { println(it) }
      }

      mongoClient.close()
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the `SynonymsExplicitQuery.kt` file.

  When you run the `SynonymsExplicitQuery.kt` program in your IDE, it prints the following documents:

  ```none
  Document{{title=Fedora, score=5.6159772872924805}}
  Document{{title=Vessel, score=5.3159894943237305}}
  Document{{title=Boats, score=4.597315311431885}}
  Document{{title=And the Ship Sails On, score=4.299008369445801}}
  Document{{title=Broken Vessels, score=4.299008369445801}}
  Document{{title=Sailing to Paradise, score=4.299008369445801}}
  Document{{title=Top Hat, score=4.01986026763916}}
  Document{{title=A Hatful of Rain, score=4.01986026763916}}
  Document{{title=Boat People, score=3.717820644378662}}
  Document{{title=Boat Trip, score=3.717820644378662}}
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the Node.js Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB Node.js driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Initialize your Node.js project.

```shell
# Create a new directory and initialize the project
mkdir atlas-search-project && cd atlas-search-project
npm init -y

# Add the MongoDB Node.js Driver to your project
npm install mongodb
```

For detailed installation instructions, see the [MongoDB Node Driver documentation](https://www.mongodb.com/docs/drivers/node/current/).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```javascript
const { MongoClient } = require('mongodb');

async function createTransportSynonyms() {
  // Connection URI
  const uri = '<connection-string>';

  // Create a new MongoClient
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB server
    await client.connect();

    // Get the sample_mflix database
    const database = client.db('sample_mflix');

    // Create the transport_synonyms collection
    try {
      await database.createCollection('transport_synonyms');
    } catch (err) {
      // Collection may already exist, which is fine
      console.log(`Note: ${err.message}`);
    }

    // Get the collection
    const collection = database.collection('transport_synonyms');

    // Create and insert the first document - equivalent mapping
    const doc1 = {
      mappingType: 'equivalent',
      synonyms: ['car', 'vehicle', 'automobile']
    };

    await collection.insertOne(doc1);

    // Create and insert the second document - explicit mapping
    const doc2 = {
      mappingType: 'explicit',
      input: ['boat'],
      synonyms: ['boat', 'vessel', 'sail']
    };

    await collection.insertOne(doc2);
    console.log('Synonyms collections successfully created and populated.');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    // Close the connection
    await client.close();
  }
}

// Run the function and handle any errors
createTransportSynonyms().catch(console.error);

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```javascript
const { MongoClient } = require('mongodb');

async function createMultipleSynonyms() {
  // Connection URI
  const uri = '<connection-string>';

  // Create a new MongoClient
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB server
    await client.connect();

    // Get the sample_mflix database
    const database = client.db('sample_mflix');

    // Create the transport_synonyms collection
    try {
      await database.createCollection('transport_synonyms');
    } catch (err) {
      // Collection may already exist, which is fine
      console.log(`Note: ${err.message}`);
    }

    // Get the transport_synonyms collection
    const transportCollection = database.collection('transport_synonyms');

    // Create and insert the first transport document - equivalent mapping
    const doc1 = {
      mappingType: 'equivalent',
      synonyms: ['car', 'vehicle', 'automobile']
    };

    await transportCollection.insertOne(doc1);

    // Create and insert the second transport document - explicit mapping
    const doc2 = {
      mappingType: 'explicit',
      input: ['boat'],
      synonyms: ['boat', 'vessel', 'sail']
    };

    await transportCollection.insertOne(doc2);

    // Create the attire_synonyms collection
    try {
      await database.createCollection('attire_synonyms');
    } catch (err) {
      // Collection may already exist, which is fine
      console.log(`Note: ${err.message}`);
    }

    // Get the attire_synonyms collection
    const attireCollection = database.collection('attire_synonyms');

    // Create and insert the first attire document - equivalent mapping
    const doc3 = {
      mappingType: 'equivalent',
      synonyms: ['dress', 'apparel', 'attire']
    };

    await attireCollection.insertOne(doc3);

    // Create and insert the second attire document - explicit mapping
    const doc4 = {
      mappingType: 'explicit',
      input: ['hat'],
      synonyms: ['hat', 'fedora', 'headgear']
    };

    await attireCollection.insertOne(doc4);

    console.log('Synonyms collections successfully created and populated.');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    // Close the connection
    await client.close();
  }
}

// Run the function and handle any errors
createMultipleSynonyms().catch(console.error);

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
node file-name.js
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `create-index.js` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```javascript
const { MongoClient } = require("mongodb");

// connect to your Atlas deployment
const uri =  "<connection-string>";

const client = new MongoClient(uri);

async function run() {
  try {

    // set namespace
    const database = client.db("sample_mflix");
    const collection = database.collection("movies");

    // define your MongoDB Search index
    const index = {
        name: "default",
        definition: {
            "mappings": {
                "dynamic": false,
                "fields": {
                    "title": {
                        "analyzer": "lucene.english",
                        "type": "string"
                    }
                }
            },
            "synonyms": [
                {
                    "analyzer": "lucene.english",
                    "name": "transportSynonyms",
                    "source": {
                        "collection": "transport_synonyms"
                    }
                }
            ]
        }
    }

    // run the helper method
    const result = await collection.createSearchIndex(index);
    console.log("New index name: " + result);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `create-index-multiple.js` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```javascript
const { MongoClient } = require("mongodb");

// connect to your Atlas deployment
const uri =  "<connection-string>";

const client = new MongoClient(uri);

async function run() {
  try {

    // set namespace
    const database = client.db("sample_mflix");
    const collection = database.collection("movies");

    // define your MongoDB Search index
    const index = {
        name: "default",
        definition: {
            "mappings": {
                "dynamic": false,
                "fields": {
                    "title": {
                        "analyzer": "lucene.english",
                        "type": "string"
                    }
                }
            },
            "synonyms": [
                {
                    "analyzer": "lucene.english",
                    "name": "transportSynonyms",
                    "source": {
                        "collection": "transport_synonyms"
                    }
                },
                {
                    "analyzer": "lucene.english",
                    "name": "attireSynonyms",
                    "source": {
                        "collection": "attire_synonyms"
                    }
                }
            ]
        }
    }

    // run the helper method
    const result = await collection.createSearchIndex(index);
    console.log("New index name: " + result);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
node file-name.js
```

```
New index name: default
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb`, MongoDB's Node.js driver.

- Creates an instance of the `MongoClient` class to establish a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms-equivalent-query.js`.

- Copy and paste the code example into the `synonyms-equivalent-query.js` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```javascript
  const MongoClient = require("mongodb").MongoClient;
  const assert = require("assert");

  const agg = [
    {
      $search: {
        index: "default",
        text: {
          path: "title",
          query: "automobile",
          synonyms: "transportSynonyms",
        },
      },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        _id: 0,
        title: 1,
        score: { $meta: "searchScore" },
      },
    },
  ];

  // Connection URI
  const uri = "<connection-string>";

  MongoClient.connect(uri)
    .then((client) => {
      const coll = client.db("sample_mflix").collection("movies");
      return coll
        .aggregate(agg)
        .toArray()
        .then((results) => {
          console.log(results);
          client.close();
          process.exit(0);
        });
    })
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  node synonyms-equivalent-query.js
  ```

  ```javascript
  { title: 'Cars', score: 4.197734832763672 }
  { title: 'Planes, Trains & Automobiles', score: 3.8511905670166016 }
  { title: 'Car Wash', score: 3.39473032951355 }
  { title: 'Used Cars', score: 3.39473032951355 }
  { title: 'Blue Car', score: 3.39473032951355 }
  { title: 'Cars 2', score: 3.39473032951355 }
  { title: 'Stealing Cars', score: 3.39473032951355 }
  { title: 'Cop Car', score: 3.39473032951355 }
  { title: 'The Cars That Eat People', score: 2.8496146202087402 }
  { title: 'Khrustalyov, My Car!', score: 2.8496146202087402 }
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms-explicit-query.js`.

- Copy and paste the code example into the `synonyms-explicit-query.js` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```javascript
  const MongoClient = require("mongodb").MongoClient;
  const assert = require("assert");

  const agg = [
    {
      $search: {
        index: "default",
        text: {
          path: "title",
          query: "boat",
          synonyms: "transportSynonyms",
        },
      },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        _id: 0,
        title: 1,
        score: { $meta: "searchScore" },
      },
    },
  ];

  // Connection URI
  const uri = "<connection-string>";

  MongoClient.connect(uri)
    .then((client) => {
      const coll = client.db("sample_mflix").collection("movies");
      return coll
        .aggregate(agg)
        .toArray()
        .then((results) => {
          console.log(results);
          client.close();
          process.exit(0);
        });
    })
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  node synonyms-explicit-query.js
  ```

  ```javascript
  { title: 'Vessel', score: 5.373150825500488 }
  { title: 'Boats', score: 4.589139938354492 }
  { title: 'And the Ship Sails On', score: 4.3452959060668945 }
  { title: 'Broken Vessels', score: 4.3452959060668945 }
  { title: 'Sailing to Paradise', score: 4.3452959060668945 }
  { title: 'Boat People', score: 3.711261749267578 }
  { title: 'Boat Trip', score: 3.711261749267578 }
  { title: 'Three Men in a Boat', score: 3.1153182983398438 }
  { title: 'The Glass Bottom Boat', score: 3.1153182983398438 }
  { title: 'Jack Goes Boating', score: 3.1153182983398438 }
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index with multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb`, MongoDB's Node.js driver.

- Creates an instance of the `MongoClient` class to establish a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms-equivalent-query.js`.

- Copy and paste the code example into the `synonyms-equivalent-query.js` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```javascript
  const MongoClient = require("mongodb").MongoClient;
  const assert = require("assert");

  const agg = [
    {
      $search: {
        index: "default",
        compound: {
          should: [
            {
              text: {
                path: "title",
                query: "automobile",
                synonyms: "transportSynonyms"
              }
            },
            {
              text: {
                path: "title",
                query: "attire",
                synonyms: "attireSynonyms"
              }
            }
          ]
        }
      }
    },
    {
      $limit: 10
    },
    {
      $project: {
        _id: 0,
        title: 1,
        score: {
          $meta: "searchScore"
        }
      }
    }
  ];

  // Connection URI
  const uri = "<connection-string>";

  MongoClient.connect(uri)
    .then((client) => {
      const coll = client.db("sample_mflix").collection("movies");
      return coll
        .aggregate(agg)
        .toArray()
        .then((results) => {
          console.log(results);
          client.close();
          process.exit(0);
        });
    })
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  node synonyms-equivalent-query.js
  ```

  ```javascript
  { title: 'The Dress', score: 4.812004089355469 }
  { title: 'Cars', score: 4.197734832763672 }
  { title: 'Dressed to Kill', score: 3.891493320465088 }
  { title: '27 Dresses', score: 3.891493320465088 }
  { title: 'Planes, Trains & Automobiles', score: 3.8511905670166016 }
  { title: 'Car Wash', score: 3.39473032951355 }
  { title: 'Used Cars', score: 3.39473032951355 }
  { title: 'Blue Car', score: 3.39473032951355 }
  { title: 'Cars 2', score: 3.39473032951355 }
  { title: 'Stealing Cars', score: 3.39473032951355 }

  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms-explicit-query.js`.

- Copy and paste the code example into the `synonyms-explicit-query.js` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```javascript
  const MongoClient = require("mongodb").MongoClient;
  const assert = require("assert");

  const agg = [
    {
      $search: {
        index: "default",
        compound: {
          should: [
            {
              text: {
                path: "title",
                query: "boat",
                synonyms: "transportSynonyms"
              }
            },
            {
              text: {
                path: "title",
                query: "hat",
                synonyms: "attireSynonyms"
              }
            }
          ]
        }
      }
    },
    {
      $limit: 10
    },
    {
      $project: {
        _id: 0,
        title: 1,
        score: {
          $meta: "searchScore"
        }
      }
    }
  ];

  // Connection URI
  const uri = "<connection-string>";

  MongoClient.connect(uri)
    .then((client) => {
      const coll = client.db("sample_mflix").collection("movies");
      return coll
        .aggregate(agg)
        .toArray()
        .then((results) => {
          console.log(results);
          client.close();
          process.exit(0);
        });
    })
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  node synonyms-explicit-query.js
  ```

  ```javascript
  { title: 'Fedora', score: 5.673145294189453 }
  { title: 'Vessel', score: 5.373150825500488 }
  { title: 'Boats', score: 4.589139938354492 }
  { title: 'And the Ship Sails On', score: 4.3452959060668945 }
  { title: 'Broken Vessels', score: 4.3452959060668945 }
  { title: 'Sailing to Paradise', score: 4.3452959060668945 }
  { title: 'Top Hat', score: 4.066137313842773 }
  { title: 'A Hatful of Rain', score: 4.066137313842773 }
  { title: 'Boat People', score: 3.711261749267578 }
  { title: 'Boat Trip', score: 3.711261749267578 }

  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the Python Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB Python driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up the Python project.

```shell
# Create a new directory for the project
mkdir atlas-search-project && cd atlas-search-project

# Install PyMongo
pip install pymongo
```

For detailed installation instructions, see [MongoDB Python Driver (PyMongo)](https://www.mongodb.com/docs/languages/python/pymongo-driver/get-started/#std-label-pymongo-get-started-download-and-install).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```python
from pymongo import MongoClient
import sys

def main():
    try:
        # Connect to MongoDB
        client = MongoClient("<connection-string>")

        # Get the sample_mflix database
        database = client["sample_mflix"]

        # Create the transport_synonyms collection
        try:
            database.create_collection("transport_synonyms")
        except Exception as e:
            # Collection may already exist, which is fine
            print(f"Note: {str(e)}")

        # Get the collection
        collection = database["transport_synonyms"]

        # Create and insert the first document - equivalent mapping
        doc1 = {
            "mappingType": "equivalent",
            "synonyms": ["car", "vehicle", "automobile"]
        }

        collection.insert_one(doc1)

        # Create and insert the second document - explicit mapping
        doc2 = {
            "mappingType": "explicit",
            "input": ["boat"],
            "synonyms": ["boat", "vessel", "sail"]
        }

        collection.insert_one(doc2)

        print("Synonyms collections successfully created and populated.")

    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
    finally:
        # Close the connection
        client.close()

if __name__ == "__main__":
    main()

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```python
from pymongo import MongoClient
import sys

def main():
    try:
        # Connect to MongoDB
        client = MongoClient("<connection-string>")

        # Get the sample_mflix database
        database = client["sample_mflix"]

        # Create the transport_synonyms collection
        try:
            database.create_collection("transport_synonyms")
        except Exception as e:
            # Collection may already exist, which is fine
            print(f"Note: {str(e)}")

        # Get the transport_synonyms collection
        transport_collection = database["transport_synonyms"]

        # Create and insert the first transport document - equivalent mapping
        doc1 = {
            "mappingType": "equivalent",
            "synonyms": ["car", "vehicle", "automobile"]
        }

        transport_collection.insert_one(doc1)

        # Create and insert the second transport document - explicit mapping
        doc2 = {
            "mappingType": "explicit",
            "input": ["boat"],
            "synonyms": ["boat", "vessel", "sail"]
        }

        transport_collection.insert_one(doc2)

        # Create the attire_synonyms collection
        try:
            database.create_collection("attire_synonyms")
        except Exception as e:
            # Collection may already exist, which is fine
            print(f"Note: {str(e)}")

        # Get the attire_synonyms collection
        attire_collection = database["attire_synonyms"]

        # Create and insert the first attire document - equivalent mapping
        doc3 = {
            "mappingType": "equivalent",
            "synonyms": ["dress", "apparel", "attire"]
        }

        attire_collection.insert_one(doc3)

        # Create and insert the second attire document - explicit mapping
        doc4 = {
            "mappingType": "explicit",
            "input": ["hat"],
            "synonyms": ["hat", "fedora", "headgear"]
        }

        attire_collection.insert_one(doc4)

        print("Synonyms collections successfully created and populated.")

    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
    finally:
        # Close the connection
        client.close()

if __name__ == "__main__":
    main()

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
python file_name.py
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `create_index.py` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```python
from pymongo import MongoClient
from pymongo.operations import SearchIndexModel

# connect to your Atlas deployment
uri = "<connection-string>"
client = MongoClient(uri)

# set namespace
database = client["sample_mflix"]
collection = database["movies"]

# define your MongoDB Search index
search_index_model = SearchIndexModel(
    definition={
        "mappings": {
            "dynamic": False,
            "fields": {
                "title": {
                   "analyzer": "lucene.english",
                   "type": "string"
                }
            }
        },
        "synonyms": [
            {
                "analyzer": "lucene.english",
                "name": "transportSynonyms",
                "source": {
                    "collection": "transport_synonyms"
                }
            }
        ]
    },
    name="default",
)

# create the index
result = collection.create_search_index(model=search_index_model)
print(f"New index name: {result}")
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `create_index_multiple.py` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```python
from pymongo import MongoClient
from pymongo.operations import SearchIndexModel

# connect to your Atlas deployment
uri = "<connection-string>"
client = MongoClient(uri)

# set namespace
database = client["sample_mflix"]
collection = database["movies"]

# define your MongoDB Search index
search_index_model = SearchIndexModel(
    definition={
        "mappings": {
            "dynamic": False,
            "fields": {
                "title": {
                   "analyzer": "lucene.english",
                   "type": "string"
                }
            }
        },
        "synonyms": [
            {
                "analyzer": "lucene.english",
                "name": "transportSynonyms",
                "source": {
                    "collection": "transport_synonyms"
                }
            },
            {
                "analyzer": "lucene.english",
                "name": "attireSynonyms",
                "source": {
                    "collection": "attire_synonyms"
                }
            }
        ]
    },
    name="default",
)

# create the index
result = collection.create_search_index(model=search_index_model)
print(f"New index name: {result}")
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
python file_name.py
```

```
New index name: default
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `pymongo`, MongoDB's Python driver, and the `dns` module, which is required to connect `pymongo` to `Atlas` using a DNS (Domain Name System) seed list connection string.

- Creates an instance of the `MongoClient` class to establish a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms-equivalent-query.py`.

- Copy and paste the code example into the `synonyms-equivalent.py` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`

  ```python
  import pymongo
  import dns

  client = pymongo.MongoClient('<connection-string>')
  result = client['sample_mflix']['movies'].aggregate([
    {
      '$search': {
        'index': 'default',
        'text': {
          'path': 'title',
          'query': 'automobile',
          'synonyms': 'transportSynonyms'
        }
      }
    },
    {
      '$limit': 10
    },
    {
      '$project': {
        '_id': 0,
        'title': 1,
        'score': {
          '$meta': 'searchScore'
        }
      }
    }
  ])

  for i in result:
      print(i)

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  python synonyms-equivalent-query.py
  ```

  ```python
  {'title': 'Cars', 'score': 4.197734832763672}
  {'title': 'Planes, Trains & Automobiles', 'score': 3.8511905670166016}
  {'title': 'Car Wash', 'score': 3.39473032951355}
  {'title': 'Used Cars', 'score': 3.39473032951355}
  {'title': 'Blue Car', 'score': 3.39473032951355}
  {'title': 'Cars 2', 'score': 3.39473032951355}
  {'title': 'Stealing Cars', 'score': 3.39473032951355}
  {'title': 'Cop Car', 'score': 3.39473032951355}
  {'title': 'The Cars That Eat People', 'score': 2.8496146202087402}
  {'title': 'Khrustalyov, My Car!', 'score': 2.8496146202087402}
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms-explicit-query.py`.

- Copy and paste the code example into the `synonyms-explicit.py` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```python
  import pymongo
  import dns

  client = pymongo.MongoClient('<connection-string>')
  result = client['sample_mflix']['movies'].aggregate([
    {
      '$search': {
        'index': 'default',
        'text': {
          'path': 'title',
          'query': 'boat',
          'synonyms': 'transportSynonyms'
        }
      }
    },
    {
      '$limit': 10
    },
    {
      '$project': {
        '_id': 0,
        'title': 1,
        'score': {
          '$meta': 'searchScore'
        }
      }
    }
  ])

  for i in result:
      print(i)

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  python synonyms-explicit-query.py
  ```

  ```python
  {'title': 'Vessel', 'score': 5.373150825500488}
  {'title': 'Boats', 'score': 4.589139938354492}
  {'title': 'And the Ship Sails On', 'score': 4.3452959060668945}
  {'title': 'Broken Vessels', 'score': 4.3452959060668945}
  {'title': 'Sailing to Paradise', 'score': 4.3452959060668945}
  {'title': 'Boat People', 'score': 3.711261749267578}
  {'title': 'Boat Trip', 'score': 3.711261749267578}
  {'title': 'Three Men in a Boat', 'score': 3.1153182983398438}
  {'title': 'The Glass Bottom Boat', 'score': 3.1153182983398438}
  {'title': 'Jack Goes Boating', 'score': 3.1153182983398438}
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index with multiple synonym mappings.

These code examples perform the following tasks:

- Imports `pymongo`, MongoDB's Python driver, and the `dns` module, which is required to connect `pymongo` to `Atlas` using a DNS (Domain Name System) seed list connection string.

- Creates an instance of the `MongoClient` class to establish a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms-equivalent-query.py`.

- Copy and paste the code example into the `synonyms-equivalent.py` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```python
  import pymongo
  import dns

  client = pymongo.MongoClient('<connection-string>')
  result = client['sample_mflix']['movies'].aggregate([
      {
          '$search': {
              'index': 'default',
              'compound': {
                  'should': [
                      {
                          'text': {
                              'path': 'title',
                              'query': 'automobile',
                              'synonyms': 'transportSynonyms'
                          }
                      }, {
                          'text': {
                              'path': 'title',
                              'query': 'attire',
                              'synonyms': 'attireSynonyms'
                          }
                      }
                  ]
              }
          }
      }, {
          '$limit': 10
      }, {
          '$project': {
              '_id': 0,
              'title': 1,
              'score': {
                  '$meta': 'searchScore'
              }
          }
      }
  ])

  for i in result:
      print(i)

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  python synonyms-equivalent-query.py
  ```

  ```json
  {'title': 'The Dress', 'score': 4.812004089355469}
  {'title': 'Cars', 'score': 4.197734832763672}
  {'title': 'Dressed to Kill', 'score': 3.891493320465088}
  {'title': '27 Dresses', 'score': 3.891493320465088}
  {'title': 'Planes, Trains & Automobiles', 'score': 3.8511905670166016}
  {'title': 'Car Wash', 'score': 3.39473032951355}
  {'title': 'Used Cars', 'score': 3.39473032951355}
  {'title': 'Blue Car', 'score': 3.39473032951355}
  {'title': 'Cars 2', 'score': 3.39473032951355}
  {'title': 'Stealing Cars', 'score': 3.39473032951355}
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms-explicit-query.py`.

- Copy and paste the code example into the `synonyms-explicit.py` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```python
  import pymongo
  import dns

  client = pymongo.MongoClient('<connection-string>')
  result = client['sample_mflix']['movies'].aggregate([
      {
          '$search': {
              'index': 'default',
              'compound': {
                  'should': [
                      {
                          'text': {
                              'path': 'title',
                              'query': 'boat',
                              'synonyms': 'transportSynonyms'
                          }
                      }, {
                          'text': {
                              'path': 'title',
                              'query': 'hat',
                              'synonyms': 'attireSynonyms'
                          }
                      }
                  ]
              }
          }
      }, {
          '$limit': 10
      }, {
          '$project': {
              '_id': 0,
              'title': 1,
              'score': {
                  '$meta': 'searchScore'
              }
          }
      }
  ])

  for i in result:
      print(i)

  ```

- Before you run the sample, replace `<connection-string>` with your connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  python synonyms-explicit-query.py
  ```

  ```json
  {'title': 'Fedora', 'score': 5.673145294189453}
  {'title': 'Vessel', 'score': 5.373150825500488}
  {'title': 'Boats', 'score': 4.589139938354492}
  {'title': 'And the Ship Sails On', 'score': 4.3452959060668945}
  {'title': 'Broken Vessels', 'score': 4.3452959060668945}
  {'title': 'Sailing to Paradise', 'score': 4.3452959060668945}
  {'title': 'Top Hat', 'score': 4.066137313842773}
  {'title': 'A Hatful of Rain', 'score': 4.066137313842773}
  {'title': 'Boat People', 'score': 3.711261749267578}
  {'title': 'Boat Trip', 'score': 3.711261749267578}

  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with Compass

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB C++ driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in both the tabs to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

### Connect to your cluster using MongoDB Compass.

Open [Compass](https://www.mongodb.com/try/download/compass) and connect to your cluster. For detailed instructions, see [Connect to a Cluster via Compass](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/compass-connection/#std-label-atlas-connect-via-compass).

### Create the collection.

On the Database screen, select the database `sample_mflix`, then select Create Collection.

### Specify the collection name.

Enter `transport_synonyms` as the collection name and select Create Collection.

### Load sample data into the collection.

- Select the `transport_synonyms` collection if it's not already selected.

- Click Add Data for each of the sample documents to add to the collection.

- Click Insert Document to replace the default document.

- Copy and paste the following sample documents, one at a time, and click Insert to add the documents, one at a time, to the collection.

  ```json
  {
    "mappingType": "equivalent",
    "synonyms": ["car", "vehicle", "automobile"]
  }
  ```

  ```json
  {
    "mappingType": "explicit",
    "input": ["boat"],
    "synonyms": ["boat", "vessel", "sail"]
  }
  ```

</Tab>

<Tab name="Attire Synonyms">

Create and populate the `attire_synonyms` collection:

### Connect to your cluster using MongoDB Compass.

Open [Compass](https://www.mongodb.com/try/download/compass) and connect to your cluster. For detailed instructions, see [Connect to a Cluster via Compass](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/compass-connection/#std-label-atlas-connect-via-compass).

### Create the collection.

On the Database screen, select the database `sample_mflix`, then select Create Collection.

### Specify the collection name.

Enter `attire_synonyms` as the collection name and select Create Collection.

### Load sample data into the collection.

- Select the `attire_synonyms` collection if it's not already selected.

- Click Add Data for each of the sample documents to add to the collection.

- Click Insert Document to replace the default document.

- Copy and paste the following sample documents, one at a time, and click Insert to add the documents, one at a time, to the collection.

  ```json
  {
    "mappingType": "equivalent",
    "synonyms": ["dress", "apparel", "attire"]
  }
  ```

  ```json
  {
    "mappingType": "explicit",
    "input": ["hat"],
    "synonyms": ["hat", "fedora", "headgear"]
  }
  ```

</Tab>

</Tabs>

## Create the MongoDB Search Index

### Connect to your cluster using MongoDB Compass.

Open [Compass](https://www.mongodb.com/try/download/compass) and connect to your cluster. For detailed instructions, see [Connect to a Cluster via Compass](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/compass-connection/#std-label-atlas-connect-via-compass).

### Specify the database and collection.

On the Database screen, click the name of the database, then click the name of the collection.

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

- Click the Indexes tab, then select Search Indexes.

- Click Create Atlas Search Index to open the index creation dialog box.

- Name the index, `default`.

- Specify the JSON (Javascript Object Notation) MongoDB Search index definition.

  The following index definition specifies:

  - The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
    `lucene.english` as the default analyzer for both indexing and querying the `title` field.

  - The name `transportSynonyms` as the name for this synonym mapping.

  - The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

  ```json
  {
    "mappings": {
      "dynamic": false,
      "fields": {
        "title": {
          "analyzer": "lucene.english",
          "type": "string"
        }
      }
    },
    "synonyms": [
      {
        "analyzer": "lucene.english",
        "name": "transportSynonyms",
        "source": {
          "collection": "transport_synonyms"
        }
      }
    ]
  }
  ```

- Click Create Search Index.

</Tab>

<Tab name="Multiple Synonym Mappings">

- Click the Indexes tab, then select Search Indexes.

- Click Create Atlas Search Index to open the index creation dialog box.

- Name the index, `default`.

- Specify the JSON (Javascript Object Notation) MongoDB Search index definition.

  The following index definition specifies:

  - The `lucene.english` [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers) as the default analyzer for both indexing and querying the `title` field.

  - The name `transportSynonyms` and `attireSynonyms` as the names for the synonym mappings.

  - The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in the sample query in this tutorial).

  - The `attire_synonyms` collection as the source synonyms collection to look for synonyms for queries using `attireSynonyms` mapping. `attireSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in the sample query in this tutorial).

  ```json
  {
    "mappings": {
      "dynamic": false,
      "fields": {
        "title": {
          "analyzer": "lucene.english",
          "type": "string"
        }
      }
    },
    "synonyms": [
      {
        "analyzer": "lucene.english",
        "name": "transportSynonyms",
        "source": {
          "collection": "transport_synonyms"
        }
      },
      {
        "analyzer": "lucene.english",
        "name": "attireSynonyms",
        "source": {
          "collection": "attire_synonyms"
        }
      }
    ]
  }

  ```

- Click Create Search Index.

</Tab>

</Tabs>

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Connect to your cluster in MongoDB Compass.

Open MongoDB Compass and connect to your cluster. For detailed instructions on connecting, see [Connect to a Cluster via Compass](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/compass-connection/#std-label-atlas-connect-via-compass).

## Use the `movies` collection in the `sample_mflix` database.

On the Database screen, click the `sample_mflix` database, then click the `movies` collection.

## Run simple MongoDB Search queries on the `movies` collection.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

The query searches the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query includes the following stages:

- [$limit](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/) stage to limit the output to 10 results

- [$project](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/) stage to exclude all fields except `title` and add a field named `score`

To run this query in MongoDB Compass:

- Click the Aggregations tab.

- Click Select..., then configure each of the following pipeline stages by selecting the stage from the dropdown and adding the query for that stage. Click Add Stage to add additional stages.

  <table>
  <tr>
  <th id="Pipeline%20Stage">
  Pipeline Stage

  </th>
  <th id="Query">
  Query

  </th>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$search`

  </td>
  <td headers="Query">
  ```javascript
  {
    "index": "synonyms-tutorial",
    "text": {
      "path": "title",
      "query": "automobile",
      "synonyms": "transportSynonyms"
    }
  }
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$limit`

  </td>
  <td headers="Query">
  ```javascript
  10
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$project`

  </td>
  <td headers="Query">
  ```javascript
  {
    "_id": 0,
    "title": 1,
    "score": { "$meta": "searchScore" }
  }
  ```

  </td>
  </tr>
  </table>If you [enabled](https://www.mongodb.com/docs/compass/current/aggregation-pipeline-builder/#set-the-documents-limit-or-auto-preview-documents)
  Auto Preview, MongoDB Compass displays the following documents next to the `$project` pipeline stage:

  ```json
  {title Cars} {score 4.197734832763672}
  {title Planes, Trains & Automobiles} {score 3.8511905670166016}
  {title Car Wash} {score 3.39473032951355}
  {title Used Cars} {score 3.39473032951355}
  {title Blue Car} {score 3.39473032951355}
  {title Cars 2} {score 3.39473032951355}
  {title Stealing Cars} {score 3.39473032951355}
  {title Cop Car} {score 3.39473032951355}
  {title The Cars That Eat People} {score 2.8496146202087402}
  {title Khrustalyov, My Car!} {score 2.8496146202087402}
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

The query searches the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. It includes the following stages:

- [$limit](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/) stage to limit the output to 10 results

- [$project](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/) stage to exclude all fields except `title` and add a field named `score`

To run this query in MongoDB Compass:

- Click the Aggregations tab.

- Click Select..., then configure each of the following pipeline stages by selecting the stage from the dropdown and adding the query for that stage. Click Add Stage to add additional stages.

  <table>
  <tr>
  <th id="Pipeline%20Stage">
  Pipeline Stage

  </th>
  <th id="Query">
  Query

  </th>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$search`

  </td>
  <td headers="Query">
  ```javascript
  {
    "index": "synonyms-tutorial",
    "text": {
      "path": "title",
      "query": "boat",
      "synonyms": "transportSynonyms"
    }
  }
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$limit`

  </td>
  <td headers="Query">
  ```javascript
  10
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$project`

  </td>
  <td headers="Query">
  ```javascript
  {
    "_id": 0,
    "title": 1,
    "score": { "$meta": "searchScore" }
  }
  ```

  </td>
  </tr>
  </table>If you [enabled](https://www.mongodb.com/docs/compass/current/aggregation-pipeline-builder/#set-the-documents-limit-or-auto-preview-documents)
  Auto Preview, MongoDB Compass displays the following documents next to the `$project` pipeline stage:

  ```json
  {title Vessel} {score 5.373150825500488}
  {title Boats} {score 4.589139938354492}
  {title And the Ship Sails On} {score 4.3452959060668945}
  {title Broken Vessels} {score 4.3452959060668945}
  {title Sailing to Paradise} {score 4.3452959060668945}
  {title Boat People} {score 3.711261749267578}
  {title Boat Trip} {score 3.711261749267578}
  {title Three Men in a Boat} {score 3.1153182983398438}
  {title The Glass Bottom Boat} {score 3.1153182983398438}
  {title Jack Goes Boating} {score 3.1153182983398438}
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index that contains multiple synonym mappings.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

The query searches the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

The query includes the following stages:

- [$limit](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/) stage to limit the output to 10 results

- [$project](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/) stage to exclude all fields except `title` and add a field named `score`

To run this query in MongoDB Compass:

- Click the Aggregations tab.

- Click Select..., then configure each of the following pipeline stages by selecting the stage from the dropdown and adding the query for that stage. Click Add Stage to add additional stages.

  <table>
  <tr>
  <th id="Pipeline%20Stage">
  Pipeline Stage

  </th>
  <th id="Query">
  Query

  </th>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$search`

  </td>
  <td headers="Query">
  ```javascript
  {
    "index": "synonyms-tutorial",
    "compound": {
      "should": [{
        "text": {
          "path": "title",
          "query": "automobile",
          "synonyms": "transportSynonyms"
        }
      },
      {
        "text": {
          "path": "title",
          "query": "attire",
          "synonyms": "attireSynonyms"
        }
      }]
    }
  }
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$limit`

  </td>
  <td headers="Query">
  ```javascript
  10
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$project`

  </td>
  <td headers="Query">
  ```javascript
  {
    "_id": 0,
    "title": 1,
    "score": { "$meta": "searchScore" }
  }
  ```

  </td>
  </tr>
  </table>If you [enabled](https://www.mongodb.com/docs/compass/current/aggregation-pipeline-builder/#set-the-documents-limit-or-auto-preview-documents)
  Auto Preview, MongoDB Compass displays the following documents next to the `$project` pipeline stage:

  ```json
  { title: 'The Dress', score: 4.812004089355469 },
  { title: 'Cars', score: 4.197734832763672 },
  { title: 'Dressed to Kill', score: 3.891493320465088 },
  { title: '27 Dresses', score: 3.891493320465088 },
  { title: 'Planes, Trains & Automobiles', score: 3.8511905670166016 },
  { title: 'Car Wash', score: 3.39473032951355 },
  { title: 'Used Cars', score: 3.39473032951355 },
  { title: 'Blue Car', score: 3.39473032951355 },
  { title: 'Cars 2', score: 3.39473032951355 },
  { title: 'Stealing Cars', score: 3.39473032951355 }
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

The query searches the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

The query includes the following stages:

- [$limit](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/) stage to limit the output to 10 results

- [$project](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/) stage to exclude all fields except `title` and add a field named `score`

To run this query in MongoDB Compass:

- Click the Aggregations tab.

- Click Select..., then configure each of the following pipeline stages by selecting the stage from the dropdown and adding the query for that stage. Click Add Stage to add additional stages.

  <table>
  <tr>
  <th id="Pipeline%20Stage">
  Pipeline Stage

  </th>
  <th id="Query">
  Query

  </th>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$search`

  </td>
  <td headers="Query">
  ```javascript
  {
    "index": "synonyms-tutorial",
    "compound": {
      "should": [{
        "text": {
          "path": "title",
          "query": "boat",
          "synonyms": "transportSynonyms"
        }
      },
      {
        "text": {
          "path": "title",
          "query": "hat",
          "synonyms": "attireSynonyms"
        }
      }]
    }
  }
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$limit`

  </td>
  <td headers="Query">
  ```javascript
  10
  ```

  </td>
  </tr>
  <tr>
  <td headers="Pipeline%20Stage">
  `$project`

  </td>
  <td headers="Query">
  ```javascript
  {
    "_id": 0,
    "title": 1,
    "score": { "$meta": "searchScore" }
  }
  ```

  </td>
  </tr>
  </table>If you [enabled](https://www.mongodb.com/docs/compass/current/aggregation-pipeline-builder/#set-the-documents-limit-or-auto-preview-documents)
  Auto Preview, MongoDB Compass displays the following documents next to the `$project` pipeline stage:

  ```json
  { title: 'Fedora', score: 5.673145294189453 },
  { title: 'Vessel', score: 5.373150825500488 },
  { title: 'Boats', score: 4.589139938354492 },
  { title: 'And the Ship Sails On', score: 4. 3452959060668945 },
  { title: 'Broken Vessels', score: 4.3452959060668945 },
  { title: 'Sailing to Paradise', score: 4.3452959060668945 },
  { title: 'Top Hat', score: 4.066137313842773 },
  { title: 'A Hatful of Rain', score: 4.066137313842773 },
  { title: 'Boat People', score: 3.711261749267578 },
  { title: 'Boat Trip', score: 3.711261749267578 }
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection using the Mongo Shell

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database, and then use the synonyms source collections with an index of the `movies` collection in the same database.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in both the tabs to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

### Connect to the deployment using mongosh.

In your terminal, connect to your Atlas cloud-hosted deployment or local deployment from [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh). For detailed instructions on how to connect, see [Connect to a Deployment](https://www.mongodb.com/docs/mongodb-shell/connect/).

### Switch to the `sample_mflix` database.

```shell
 use sample_mflix
```

```shell
switched to db sample_mflix
```

### Create the `transport_synonyms` collection.

```shell
 db.createCollection("transport_synonyms")
```

```shell
{ "ok" : 1 }
```

### Insert documents into the `transport_synonyms` collection.

Insert the following documents that define synonym mappings:

```shell
 db.transport_synonyms.insertMany([
   {
     "mappingType": "equivalent",
     "synonyms": ["car", "vehicle", "automobile"]
   },
   {
     "mappingType": "explicit",
     "input": ["boat"],
     "synonyms": ["boat", "vessel", "sail"]
   }
 ])
```

```shell
{
  "acknowledged" : true,
  "insertedIds" : [
    ObjectId("..."),
    ObjectId("...")
  ]
}
```

</Tab>

<Tab name="Attire Synonyms">

Create and populate the `attire_synonyms` collection:

### Connect to the deployment using mongosh.

In your terminal, connect to your Atlas cloud-hosted deployment or local deployment from [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh). For detailed instructions on how to connect, see [Connect to a Deployment](https://www.mongodb.com/docs/mongodb-shell/connect/).

### Switch to the `sample_mflix` database.

```shell
 use sample_mflix
```

```shell
switched to db sample_mflix
```

### Create the `attire_synonyms` collection.

```shell
 db.createCollection("attire_synonyms")
```

```shell
{ "ok" : 1 }
```

### Insert documents into the `attire_synonyms` collection.

Insert the following documents that define synonym mappings:

```shell
 db.attire_synonyms.insertMany([
   {
     "mappingType": "equivalent",
     "synonyms": ["dress", "apparel", "attire"]
   },
   {
     "mappingType": "explicit",
     "input": ["hat"],
     "synonyms": ["hat", "fedora", "headgear"]
   }
 ])
```

```shell
{
  "acknowledged" : true,
  "insertedIds" : [
    ObjectId("..."),
    ObjectId("...")
  ]
}
```

</Tab>

</Tabs>

## Create the MongoDB Search Index

### Connect to the deployment by using `mongosh`.

In your terminal, connect to your Atlas cloud-hosted deployment or local deployment from [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh). For detailed instructions on how to connect, see [Connect to a Deployment](https://www.mongodb.com/docs/mongodb-shell/connect/).

### Switch to the database that contains the collection for which you want to create the index.

```shell
 use sample_mflix
```

```shell
switched to db sample_mflix
```

### Run the `db.collection.createSearchIndex()` method to create the index.

To run the simple example query only, run the command in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the command that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```shell
db.movies.createSearchIndex(
  "default",
    {
      "mappings": {
        "dynamic": false,
        "fields": {
          "title": {
            "analyzer": "lucene.english",
            "type": "string"
          }
        }
      },
      "synonyms": [
        {
          "analyzer": "lucene.english",
          "name": "transportSynonyms",
          "source": {
            "collection": "transport_synonyms"
          }
        }
      ]
    }
)
```

```
default
```

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

</Tab>

<Tab name="Multiple Synonym Mappings">

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```shell
db.movies.createSearchIndex(
  "default",
    {
      "mappings": {
        "dynamic": false,
        "fields": {
          "title": {
            "analyzer": "lucene.english",
            "type": "string"
          }
        }
      },
      "synonyms": [
        {
          "analyzer": "lucene.english",
          "name": "transportSynonyms",
          "source": {
            "collection": "transport_synonyms"
          }
        },
        {
          "analyzer": "lucene.english",
          "name": "attireSynonyms",
          "source": {
            "collection": "attire_synonyms"
          }
        }
      ]
    }
)
```

```
default
```

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

</Tab>

</Tabs>

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Connect to your cluster in [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh).

Open [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh) in a terminal window and connect to your cluster. For detailed instructions on connecting, see [Connect to a Cluster via mongosh](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/mongo-shell-connection/).

## Use the `sample_mflix` database.

Run the following command at [`mongosh`](https://www.mongodb.com/docs/mongodb-shell/#mongodb-binary-bin.mongosh) prompt:

```javascript
use sample_mflix
```

## Run the following example queries on the `movies` collection.

If you created an index with a single synonym mapping definition, run the query in the Simple Example tab below. If you defined multiple synonym mappings in your index, you can run the queries in both the tabs below.

These queries use the following pipeline stages:

- [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the collection.

- [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to `10` results.

- [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to:

  - Exclude all fields except the `title` field.

  - Add a field named `score`.

<Tabs>

<Tab name="Simple Example">

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

The query searches the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

```json
db.movies.aggregate([
  {
    $search: {
      "index": "synonyms-tutorial",
      "text": {
        "path": "title",
        "query": "automobile",
        "synonyms": "transportSynonyms"
      }
    }
  },
  {
    $limit: 10
  },
  {
    $project: {
      "_id": 0,
      "title": 1,
      "score": { $meta: "searchScore" }
    }
  }
])
```

```json
{ "title" : "Cars", "score" : 4.197734832763672 }
{ "title" : "Planes, Trains & Automobiles", "score" : 3.8511905670166016 }
{ "title" : "Car Wash", "score" : 3.39473032951355 }
{ "title" : "Used Cars", "score" : 3.39473032951355 }
{ "title" : "Blue Car", "score" : 3.39473032951355 }
{ "title" : "Cars 2", "score" : 3.39473032951355 }
{ "title" : "Stealing Cars", "score" : 3.39473032951355 }
{ "title" : "Cop Car", "score" : 3.39473032951355 }
{ "title" : "The Cars That Eat People", "score" : 2.8496146202087402 }
{ "title" : "Khrustalyov, My Car!", "score" : 2.8496146202087402 }
```

The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

The query searches the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

```json
db.movies.aggregate([
  {
    $search: {
      "index": "synonyms-tutorial",
      "text": {
        "path": "title",
        "query": "boat",
        "synonyms": "transportSynonyms"
      }
    }
  },
  {
    $limit: 10
  },
  {
    $project: {
      "_id": 0,
      "title": 1,
      "score": { $meta: "searchScore" }
    }
  }
])
```

```json
{ "title" : "Vessel", "score" : 5.373150825500488 }
{ "title" : "Boats", "score" : 4.589139938354492 }
{ "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
{ "title" : "Broken Vessels", "score" : 4.3452959060668945 }
{ "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
{ "title" : "Boat People", "score" : 3.711261749267578 }
{ "title" : "Boat Trip", "score" : 3.711261749267578 }
{ "title" : "Three Men in a Boat", "score" : 3.1153182983398438 }
{ "title" : "The Glass Bottom Boat", "score" : 3.1153182983398438 }
{ "title" : "Jack Goes Boating", "score" : 3.1153182983398438 }
```

The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

```json
{ "title" : "Vessel", "score" : 5.373150825500488 }
{ "title" : "Broken Vessels", "score" : 4.3452959060668945 }
```

MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

```json
{ "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
{ "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
```

MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

</Tab>

<Tab name="Advanced Example">

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

The query searches the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

```json
db.movies.aggregate([
  {
    $search: {
      "index": "synonyms-tutorial",
      "compound": {
        "should": [{
          "text": {
            "path": "title",
            "query": "automobile",
            "synonyms": "transportSynonyms"
          }
        },
        {
          "text": {
            "path": "title",
            "query": "attire",
            "synonyms": "attireSynonyms"
          }
        }]
      }
    }
  },
  {
    $limit: 10
  },
  {
    $project: {
      "_id": 0,
      "title": 1,
      "score": { $meta: "searchScore" }
    }
  }
])
```

```json
[
  { title: 'The Dress', score: 4.812004089355469 },
  { title: 'Cars', score: 4.197734832763672 },
  { title: 'Dressed to Kill', score: 3.891493320465088 },
  { title: '27 Dresses', score: 3.891493320465088 },
  { title: 'Planes, Trains & Automobiles', score: 3.8511905670166016 },
  { title: 'Car Wash', score: 3.39473032951355 },
  { title: 'Used Cars', score: 3.39473032951355 },
  { title: 'Blue Car', score: 3.39473032951355 },
  { title: 'Cars 2', score: 3.39473032951355 },
  { title: 'Stealing Cars', score: 3.39473032951355 }
]
```

The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

The query searches the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

```json
db.movies.aggregate([
  {
    $search: {
      "index": "synonyms-tutorial",
      "compound": {
        "should": [{
          "text": {
            "path": "title",
            "query": "boat",
            "synonyms": "transportSynonyms"
          }
        },
        {
          "text": {
            "path": "title",
            "query": "hat",
            "synonyms": "attireSynonyms"
          }
        }]
      }
    }
  },
  {
    $limit: 10
  },
  {
    $project: {
      "_id": 0,
      "title": 1,
      "score": { $meta: "searchScore" }
    }
  }
])
```

```json
[
  { title: 'Fedora', score: 5.673145294189453 },
  { title: 'Vessel', score: 5.373150825500488 },
  { title: 'Boats', score: 4.589139938354492 },
  { title: 'And the Ship Sails On', score: 4.3452959060668945 },
  { title: 'Broken Vessels', score: 4.3452959060668945 },
  { title: 'Sailing to Paradise', score: 4.3452959060668945 },
  { title: 'Top Hat', score: 4.066137313842773 },
  { title: 'A Hatful of Rain', score: 4.066137313842773 },
  { title: 'Boat People', score: 3.711261749267578 },
  { title: 'Boat Trip', score: 3.711261749267578 }
]
```

The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the C Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB C driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up the C project.

In your terminal, navigate to where you want to create your application, then run the following command to create a directory called `atlas-search-project` for this project:

```shell
# Create a new directory for the project
mkdir atlas-search-project && cd atlas-search-project
```

Add the C driver to your project by following the instructions in the [MongoDB C Driver documentation](https://www.mongodb.com/docs/languages/c/c-driver/current/get-started/).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```c
#include <bson/bson.h>
#include <mongoc/mongoc.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
    mongoc_client_t *client;
    mongoc_database_t *database;
    mongoc_collection_t *collection;
    bson_error_t error;
    bson_t *doc;
    bool ret;

    /* Initialize the MongoDB C driver */
    mongoc_init();

    /* Create a client connection to your MongoDB cluster */
    client = mongoc_client_new("<connection-string>");
    if (!client) {
        fprintf(stderr, "Failed to create client connection.\n");
        return EXIT_FAILURE;
    }

    /* Get a handle to the sample_mflix database */
    database = mongoc_client_get_database(client, "sample_mflix");

    /* Create the transport_synonyms collection */
    collection = mongoc_database_create_collection(database, "transport_synonyms", NULL, &error);
    if (!collection) {
        fprintf(stderr, "Failed to create transport_synonyms collection: %s\n", error.message);
        return EXIT_FAILURE;
    }

    /* Create and insert the first document - equivalent mapping */
    doc = BCON_NEW(
        "mappingType", BCON_UTF8("equivalent"),
        "synonyms", "[",
            BCON_UTF8("car"),
            BCON_UTF8("vehicle"),
            BCON_UTF8("automobile"),
        "]"
    );

    ret = mongoc_collection_insert_one(collection, doc, NULL, NULL, &error);
    if (!ret) {
        fprintf(stderr, "Failed to insert document: %s\n", error.message);
    }
    bson_destroy(doc);

    /* Create and insert the second document - explicit mapping */
    doc = BCON_NEW(
        "mappingType", BCON_UTF8("explicit"),
        "input", "[",
            BCON_UTF8("boat"),
        "]",
        "synonyms", "[",
            BCON_UTF8("boat"),
            BCON_UTF8("vessel"),
            BCON_UTF8("sail"),
        "]"
    );

    ret = mongoc_collection_insert_one(collection, doc, NULL, NULL, &error);
    if (!ret) {
        fprintf(stderr, "Failed to insert document: %s\n", error.message);
    }
    bson_destroy(doc);

    /* Release the collection handle */
    mongoc_collection_destroy(collection);

    /* Clean up resources */
    mongoc_database_destroy(database);
    mongoc_client_destroy(client);
    mongoc_cleanup();

    printf("Synonyms collections successfully created and populated.\n");

    return EXIT_SUCCESS;
}

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```c
#include <bson/bson.h>
#include <mongoc/mongoc.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char *argv[])
{
    mongoc_client_t *client;
    mongoc_database_t *database;
    mongoc_collection_t *collection;
    bson_error_t error;
    bson_t *doc;
    bool ret;

    /* Initialize the MongoDB C driver */
    mongoc_init();

    /* Create a client connection to your MongoDB cluster */
    client = mongoc_client_new("<connection-string>");
    if (!client) {
        fprintf(stderr, "Failed to create client connection.\n");
        return EXIT_FAILURE;
    }

    /* Get a handle to the sample_mflix database */
    database = mongoc_client_get_database(client, "sample_mflix");

    /* Create the transport_synonyms collection */
    collection = mongoc_database_create_collection(database, "transport_synonyms", NULL, &error);
    if (!collection) {
        fprintf(stderr, "Failed to create transport_synonyms collection: %s\n", error.message);
        return EXIT_FAILURE;
    }

    /* Create and insert the first transport document - equivalent mapping */
    doc = BCON_NEW(
        "mappingType", BCON_UTF8("equivalent"),
        "synonyms", "[",
            BCON_UTF8("car"),
            BCON_UTF8("vehicle"),
            BCON_UTF8("automobile"),
        "]"
    );

    ret = mongoc_collection_insert_one(collection, doc, NULL, NULL, &error);
    if (!ret) {
        fprintf(stderr, "Failed to insert document: %s\n", error.message);
    }
    bson_destroy(doc);

    /* Create and insert the second transport document - explicit mapping */
    doc = BCON_NEW(
        "mappingType", BCON_UTF8("explicit"),
        "input", "[",
            BCON_UTF8("boat"),
        "]",
        "synonyms", "[",
            BCON_UTF8("boat"),
            BCON_UTF8("vessel"),
            BCON_UTF8("sail"),
        "]"
    );

    ret = mongoc_collection_insert_one(collection, doc, NULL, NULL, &error);
    if (!ret) {
        fprintf(stderr, "Failed to insert document: %s\n", error.message);
    }
    bson_destroy(doc);

    /* Release the transport_synonyms collection handle */
    mongoc_collection_destroy(collection);

    /* Create the attire_synonyms collection */
    collection = mongoc_database_create_collection(database, "attire_synonyms", NULL, &error);
    if (!collection) {
        fprintf(stderr, "Failed to create attire_synonyms collection: %s\n", error.message);
        return EXIT_FAILURE;
    }

    /* Create and insert the first attire document - equivalent mapping */
    doc = BCON_NEW(
        "mappingType", BCON_UTF8("equivalent"),
        "synonyms", "[",
            BCON_UTF8("dress"),
            BCON_UTF8("apparel"),
            BCON_UTF8("attire"),
        "]"
    );

    ret = mongoc_collection_insert_one(collection, doc, NULL, NULL, &error);
    if (!ret) {
        fprintf(stderr, "Failed to insert document: %s\n", error.message);
    }
    bson_destroy(doc);

    /* Create and insert the second attire document - explicit mapping */
    doc = BCON_NEW(
        "mappingType", BCON_UTF8("explicit"),
        "input", "[",
            BCON_UTF8("hat"),
        "]",
        "synonyms", "[",
            BCON_UTF8("hat"),
            BCON_UTF8("fedora"),
            BCON_UTF8("headgear"),
        "]"
    );

    ret = mongoc_collection_insert_one(collection, doc, NULL, NULL, &error);
    if (!ret) {
        fprintf(stderr, "Failed to insert document: %s\n", error.message);
    }
    bson_destroy(doc);

    /* Release the attire_synonyms collection handle */
    mongoc_collection_destroy(collection);

    /* Clean up resources */
    mongoc_database_destroy(database);
    mongoc_client_destroy(client);
    mongoc_cleanup();

    printf("Synonyms collections successfully created and populated.\n");

    return EXIT_SUCCESS;
}

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Set up a CMake application

To configure your application, create a `CMakeLists.txt` file in your project directory. Then, add the following code to the file:

```txt
cmake_minimum_required(VERSION 3.11)
project(atlas-search-project LANGUAGES C)
add_executable (load.out synonyms.c)
find_package(mongoc <version> REQUIRED)
target_link_libraries(load.out mongoc::mongoc)
```

The preceding code performs the following actions:

- Configures a C project.

- Creates a `load.out` executable for your application.

- Finds and requires the C driver. Replace the `<version>` placeholder with your C driver version synonyms, such as `2.0.0`.

- Links the program to the `libmongoc` library.

In the sample `CMakeLists.txt` file, the `mongoc::mongoc` target points to either the static library or the shared library. The library type depends on which one is available and whichever type the user specifies in the `MONGOC_DEFAULT_IMPORTED_LIBRARY_TYPE` CMake configuration setting. If you don't set this value and both library types are available, `mongoc::mongoc` uses the static library.

You can use the `mongoc::static` target to explicitly use the static library or the `mongoc::shared` target to use the shared library.

### Create the index.

In your terminal, run the following commands to build and run this application:

```shell
cmake -S. -Bcmake-build
cmake --build cmake-build --target load.out
./cmake-build/load.out
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

The synonym mapping in a collection's [index](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-ref) specifies the synonyms source collection and the analyzer to use with the collection.

In this section, you create a MongoDB Search index that defines one or many synonym mappings for the `sample_mflix.movies` collection. The mapping definition in the index references the synonyms source collection that you created in the `sample_mflix` database.

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `create_index.c` file in your project directory, and copy and paste the following code into the file. The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```c
#include <mongoc/mongoc.h>
#include <stdlib.h>

int main (void)
{
    mongoc_client_t *client = NULL;
    mongoc_collection_t *collection = NULL;
    mongoc_database_t *database = NULL;
    bson_error_t error;
    bson_t cmd = BSON_INITIALIZER;
    bool ok = true;

    mongoc_init();

    // Connect to your Atlas deployment
    client = mongoc_client_new("<connection-string>");
    if (!client) {
        fprintf(stderr, "Failed to create a MongoDB client.\n");
        ok = false;
        goto cleanup;
    }

    // Access your database and collection
    database = mongoc_client_get_database(client, "sample_mflix");
    collection = mongoc_database_get_collection(database, "movies");

    // Specify the command and the new index
    const char *cmd_str = BSON_STR({
        "createSearchIndexes" : "movies",
        "indexes" : [ {
            "name" : "default",
            "definition" : {
                "mappings": {
                    "dynamic": false,
                    "fields": {
                        "title" : {
                            "analyzer": "lucene.english",
                            "type": "string"
                        }
                    }
                },
                "synonyms": [
                    {
                        "analyzer": "lucene.english",
                        "name": "transportSynonyms",
                        "source": {
                            "collection": "transport_synonyms"
                        }
                    }
                ]
            }
        } ]
    });

    // Convert your command to BSON
    if (!bson_init_from_json(&cmd, cmd_str, -1, &error)) {
        fprintf(stderr, "Failed to parse command: %s\n", error.message);
        ok = false;
        goto cleanup;
    }

    // Create the MongoDB Search index by running the command
    if (!mongoc_collection_command_simple (collection, &cmd, NULL, NULL, &error)) {
        fprintf(stderr, "Failed to run createSearchIndexes: %s\n", error.message);
        ok = false;
        goto cleanup;
    }
    printf ("Index created!\n");

cleanup:
   mongoc_collection_destroy (collection);
   mongoc_client_destroy (client);
   mongoc_database_destroy (database);
   bson_destroy (&cmd);
   mongoc_cleanup ();
   return ok ? EXIT_SUCCESS : EXIT_FAILURE;
}
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `create_index_multiple.c` file in your project directory, and copy and paste the following code into the file. The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```c
#include <mongoc/mongoc.h>
#include <stdlib.h>

int main (void)
{
    mongoc_client_t *client = NULL;
    mongoc_collection_t *collection = NULL;
    mongoc_database_t *database = NULL;
    bson_error_t error;
    bson_t cmd = BSON_INITIALIZER;
    bool ok = true;

    mongoc_init();

    // Connect to your Atlas deployment
    client = mongoc_client_new("<connection-string>");
    if (!client) {
        fprintf(stderr, "Failed to create a MongoDB client.\n");
        ok = false;
        goto cleanup;
    }

    // Access your database and collection
    database = mongoc_client_get_database(client, "sample_mflix");
    collection = mongoc_database_get_collection(database, "movies");

    // Specify the command and the new index
    const char *cmd_str = BSON_STR({
        "createSearchIndexes" : "movies",
        "indexes" : [ {
            "name" : "default",
            "definition" : {
                "mappings": {
                    "dynamic": false,
                    "fields": {
                        "title" : {
                            "analyzer": "lucene.english",
                            "type": "string"
                        }
                    }
                },
                "synonyms": [
                    {
                        "analyzer": "lucene.english",
                        "name": "transportSynonyms",
                        "source": {
                            "collection": "transport_synonyms"
                        }
                    },
                    {
                        "analyzer": "lucene.english",
                        "name": "attireSynonyms",
                        "source": {
                            "collection": "attire_synonyms"
                        }
                    }
                ]
            }
        } ]
    });

    // Convert your command to BSON
    if (!bson_init_from_json(&cmd, cmd_str, -1, &error)) {
        fprintf(stderr, "Failed to parse command: %s\n", error.message);
        ok = false;
        goto cleanup;
    }

    // Create the MongoDB Search index by running the command
    if (!mongoc_collection_command_simple (collection, &cmd, NULL, NULL, &error)) {
        fprintf(stderr, "Failed to run createSearchIndexes: %s\n", error.message);
        ok = false;
        goto cleanup;
    }
    printf ("Index created!\n");

cleanup:
   mongoc_collection_destroy (collection);
   mongoc_client_destroy (client);
   mongoc_database_destroy (database);
   bson_destroy (&cmd);
   mongoc_cleanup ();
   return ok ? EXIT_SUCCESS : EXIT_FAILURE;
}
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Set up a CMake application

To configure your application, create a `CMakeLists.txt` file in your project directory. Then, add the following code to the file:

```txt
cmake_minimum_required(VERSION 3.11)
project(atlas-search-index LANGUAGES C)
add_executable (index.out create_index.c)
find_package(mongoc <version> REQUIRED)
target_link_libraries(index.out mongoc::mongoc)

```

The preceding code performs the following actions:

- Configures a C project.

- Creates a `index.out` executable for your application.

- Finds and requires the C driver. Replace the `<version>` placeholder with your C driver version synonyms, such as `2.0.0`.

- Links the program to the `libmongoc` library.

In the sample `CMakeLists.txt` file, the `mongoc::mongoc` target points to either the static library or the shared library. The library type depends on which one is available and whichever type the user specifies in the `MONGOC_DEFAULT_IMPORTED_LIBRARY_TYPE` CMake configuration setting. If you don't set this value and both library types are available, `mongoc::mongoc` uses the static library.

You can use the `mongoc::static` target to explicitly use the static library or the `mongoc::shared` target to use the shared library.

### Create the index.

In your terminal, run the following commands to build and run this application:

```shell
cmake -S. -Bcmake-build
cmake --build cmake-build --target index.out
./cmake-build/index.out
```

```
Index created!
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms_equivalent_query.c`.

- Copy and paste the code example into the `synonyms_equivalent_query.c` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```c
  #include <mongoc/mongoc.h>
  #include <stdio.h>
  #include <stdlib.h>

  int main(int argc, char *argv[])
  {
      mongoc_client_t *client;
      mongoc_collection_t *collection;
      mongoc_cursor_t *cursor;
      bson_error_t error;
      const bson_t *doc;
      bson_t *pipeline;
      char *str;

      /* Initialize the MongoDB C Driver */
      mongoc_init();

      /* Connect to MongoDB */
      client = mongoc_client_new("<connection-string>");
      if (!client) {
          fprintf(stderr, "Failed to parse URI.\n");
          return EXIT_FAILURE;
      }

      /* Get a handle on the collection */
      collection = mongoc_client_get_collection(client, "sample_mflix", "movies");

      /* Create the pipeline */
      bson_t *search_stage = BCON_NEW(
          "$search", "{",
              "index", BCON_UTF8("default"),
              "text", "{",
                  "path", BCON_UTF8("title"),
                  "query", BCON_UTF8("automobile"),
                  "synonyms", BCON_UTF8("transportSynonyms"),
              "}",
          "}"
      );
      bson_t *limit_stage = BCON_NEW("$limit", BCON_INT32(10));
      bson_t *project_stage = BCON_NEW(
          "$project", "{",
              "title", BCON_INT32(1),
              "_id", BCON_INT32(0),
              "score", "{",
                  "$meta", BCON_UTF8("searchScore"),
              "}",
          "}"
      );

      /* Create the aggregation pipeline array properly */
      pipeline = bson_new();  // Create an empty array

      /* Append each stage directly to the pipeline array */
      char idx[16];
      const char *key;
      size_t idx_len;
      int i = 0;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, search_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, limit_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, project_stage);

      /* Set options (max time 5 seconds = 5000 ms) */
      mongoc_read_prefs_t *read_prefs = mongoc_read_prefs_new(MONGOC_READ_PRIMARY);
      mongoc_read_concern_t *read_concern = mongoc_read_concern_new();

      bson_t opts = BSON_INITIALIZER;
      bson_append_int32(&opts, "maxTimeMS", -1, 5000);

      /* Execute the aggregation */
      cursor = mongoc_collection_aggregate(
          collection,
          MONGOC_QUERY_NONE,
          pipeline,
          &opts,
          read_prefs
      );

      /* Display the results */
      while (mongoc_cursor_next(cursor, &doc)) {
          str = bson_as_canonical_extended_json(doc, NULL);
          printf("%s\n", str);
          bson_free(str);
      }

      /* Check if the cursor encountered any errors */
      if (mongoc_cursor_error(cursor, &error)) {
          fprintf(stderr, "Cursor Failure: %s\n", error.message);
          return EXIT_FAILURE;
      }

      /* Clean up */
      bson_destroy(search_stage);
      bson_destroy(limit_stage);
      bson_destroy(project_stage);
      bson_destroy(pipeline);
      bson_destroy(&opts);
      mongoc_read_prefs_destroy(read_prefs);
      mongoc_read_concern_destroy(read_concern);
      mongoc_cursor_destroy(cursor);
      mongoc_collection_destroy(collection);
      mongoc_client_destroy(client);
      mongoc_cleanup();

      return EXIT_SUCCESS;
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Set up a CMake application

  To configure your application, create a `CMakeLists.txt` file in your project directory. Then, add the following code to the file:

  ```txt
  cmake_minimum_required(VERSION 3.11)
  project(atlas-search-project LANGUAGES C)
  add_executable (query.out synonyms_equivalent_query.c)
  find_package(mongoc <version> REQUIRED)
  target_link_libraries(query.out mongoc::mongoc)
  ```

  The preceding code performs the following actions:

  - Configures a C project.

  - Creates a `query.out` executable for your application.

  - Finds and requires the C driver. Replace the `<version>` placeholder with your C driver version synonyms, such as `2.0.0`.

  - Links the program to the `libmongoc` library.

  In the sample `CMakeLists.txt` file, the `mongoc::mongoc` target points to either the static library or the shared library. The library type depends on which one is available and whichever type the user specifies in the `MONGOC_DEFAULT_IMPORTED_LIBRARY_TYPE` CMake configuration setting. If you don't set this value and both library types are available, `mongoc::mongoc` uses the static library.

  You can use the `mongoc::static` target to explicitly use the static library or the `mongoc::shared` target to use the shared library.

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  cmake -S. -Bcmake-build
  cmake --build cmake-build --target query.out
  ./cmake-build/query.out
  ```

  ```
  [{title Cars} {score 4.197734832763672}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  [{title Cop Car} {score 3.39473032951355}]
  [{title The Cars That Eat People} {score 2.8496146202087402}]
  [{title Khrustalyov, My Car!} {score 2.8496146202087402}]
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms_explicit_query.c`.

- Copy and paste the code example into the `synonyms_explicit_query.c` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```c
  #include <mongoc/mongoc.h>
  #include <stdio.h>
  #include <stdlib.h>

  int main(int argc, char *argv[])
  {
      mongoc_client_t *client;
      mongoc_collection_t *collection;
      mongoc_cursor_t *cursor;
      bson_error_t error;
      const bson_t *doc;
      bson_t *pipeline;
      char *str;

      /* Initialize the MongoDB C Driver */
      mongoc_init();

      /* Connect to MongoDB */
      client = mongoc_client_new("<connection-string>");
      if (!client) {
          fprintf(stderr, "Failed to parse URI.\n");
          return EXIT_FAILURE;
      }

      /* Get a handle on the collection */
      collection = mongoc_client_get_collection(client, "sample_mflix", "movies");

      /* Create the pipeline */
      pipeline = bson_new();
      bson_t *search_stage = BCON_NEW(
          "$search", "{",
              "index", BCON_UTF8("default"),
              "text", "{",
                  "path", BCON_UTF8("title"),
                  "query", BCON_UTF8("boat"),
                  "synonyms", BCON_UTF8("transportSynonyms"),
              "}",
          "}"
      );
      bson_t *limit_stage = BCON_NEW("$limit", BCON_INT32(10));
      bson_t *project_stage = BCON_NEW(
          "$project", "{",
              "title", BCON_INT32(1),
              "_id", BCON_INT32(0),
              "score", "{",
                  "$meta", BCON_UTF8("searchScore"),
              "}",
          "}"
      );

      /* Create the aggregation pipeline array properly */
      pipeline = bson_new();  // Create an empty array

      /* Append each stage directly to the pipeline array */
      char idx[16];
      const char *key;
      size_t idx_len;
      int i = 0;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, search_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, limit_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, project_stage);

      /* Set options (max time 5 seconds = 5000 ms) */
      mongoc_read_prefs_t *read_prefs = mongoc_read_prefs_new(MONGOC_READ_PRIMARY);
      mongoc_read_concern_t *read_concern = mongoc_read_concern_new();

      bson_t opts = BSON_INITIALIZER;
      bson_append_int32(&opts, "maxTimeMS", -1, 5000);

      /* Execute the aggregation */
      cursor = mongoc_collection_aggregate(
          collection,
          MONGOC_QUERY_NONE,
          pipeline,
          &opts,
          read_prefs
      );

      /* Display the results */
      while (mongoc_cursor_next(cursor, &doc)) {
          str = bson_as_canonical_extended_json(doc, NULL);
          printf("%s\n", str);
          bson_free(str);
      }

      /* Check if the cursor encountered any errors */
      if (mongoc_cursor_error(cursor, &error)) {
          fprintf(stderr, "Cursor Failure: %s\n", error.message);
          return EXIT_FAILURE;
      }

      /* Clean up */
      bson_destroy(search_stage);
      bson_destroy(limit_stage);
      bson_destroy(project_stage);
      bson_destroy(pipeline);
      bson_destroy(&opts);
      mongoc_read_prefs_destroy(read_prefs);
      mongoc_read_concern_destroy(read_concern);
      mongoc_cursor_destroy(cursor);
      mongoc_collection_destroy(collection);
      mongoc_client_destroy(client);
      mongoc_cleanup();

      return EXIT_SUCCESS;
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Set up a CMake application

  To configure your application, create a `CMakeLists.txt` file in your project directory. Then, add the following code to the file:

  ```txt
  cmake_minimum_required(VERSION 3.11)
  project(atlas-search-project LANGUAGES C)
  add_executable (query.out synonyms_explicit_query.c)
  find_package(mongoc <version> REQUIRED)
  target_link_libraries(query.out mongoc::mongoc)
  ```

  The preceding code performs the following actions:

  - Configures a C project.

  - Creates a `query.out` executable for your application.

  - Finds and requires the C driver. Replace the `<version>` placeholder with your C driver version synonyms, such as `2.0.0`.

  - Links the program to the `libmongoc` library.

  In the sample `CMakeLists.txt` file, the `mongoc::mongoc` target points to either the static library or the shared library. The library type depends on which one is available and whichever type the user specifies in the `MONGOC_DEFAULT_IMPORTED_LIBRARY_TYPE` CMake configuration setting. If you don't set this value and both library types are available, `mongoc::mongoc` uses the static library.

  You can use the `mongoc::static` target to explicitly use the static library or the `mongoc::shared` target to use the shared library.

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  cmake -S. -Bcmake-build
  cmake --build cmake-build --target query.out
  ./cmake-build/query.out
  ```

  ```
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  [{title Three Men in a Boat} {score 3.1153182983398438}]
  [{title The Glass Bottom Boat} {score 3.1153182983398438}]
  [{title Jack Goes Boating} {score 3.1153182983398438}]
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index that contains multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms_equivalent_query.c`.

- Copy and paste the code example into the `synonyms_equivalent_query.c` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```c
  #include <mongoc/mongoc.h>
  #include <stdio.h>
  #include <stdlib.h>

  int main(int argc, char *argv[])
  {
      mongoc_client_t *client;
      mongoc_collection_t *collection;
      mongoc_cursor_t *cursor;
      bson_error_t error;
      const bson_t *doc;
      bson_t *pipeline;
      char *str;

      /* Initialize the MongoDB C Driver */
      mongoc_init();

      /* Connect to MongoDB */
      client = mongoc_client_new("<connection-string>");
      if (!client) {
          fprintf(stderr, "Failed to parse URI.\n");
          return EXIT_FAILURE;
      }

      /* Get a handle on the collection */
      collection = mongoc_client_get_collection(client, "sample_mflix", "movies");

      /* Create the first text search clause for automobile */
      bson_t *text1 = BCON_NEW(
          "text", "{",
              "path", BCON_UTF8("title"),
              "query", BCON_UTF8("automobile"),
              "synonyms", BCON_UTF8("transportSynonyms"),
          "}"
      );

      /* Create the second text search clause for attire */
      bson_t *text2 = BCON_NEW(
          "text", "{",
              "path", BCON_UTF8("title"),
              "query", BCON_UTF8("attire"),
              "synonyms", BCON_UTF8("attireSynonyms"),
          "}"
      );

      /* Create the should array for compound search */
      bson_t *should_array = bson_new();
      char idx[16];
      const char *key;
      size_t idx_len;

      /* Add the text searches to the should array */
      idx_len = bson_uint32_to_string(0, &key, idx, sizeof(idx));
      bson_append_document(should_array, key, idx_len, text1);

      idx_len = bson_uint32_to_string(1, &key, idx, sizeof(idx));
      bson_append_document(should_array, key, idx_len, text2);

      /* Create the search stage directly with the should array */
      bson_t *search_stage = bson_new();
      bson_t search_doc, compound_doc;
      BSON_APPEND_DOCUMENT_BEGIN(search_stage, "$search", &search_doc);
      BSON_APPEND_UTF8(&search_doc, "index", "default");
      BSON_APPEND_DOCUMENT_BEGIN(&search_doc, "compound", &compound_doc);
      BSON_APPEND_ARRAY(&compound_doc, "should", should_array);
      bson_append_document_end(&search_doc, &compound_doc);
      bson_append_document_end(search_stage, &search_doc);

      /* Create the limit and project stages */
      bson_t *limit_stage = BCON_NEW("$limit", BCON_INT32(10));
      bson_t *project_stage = BCON_NEW(
          "$project", "{",
              "title", BCON_INT32(1),
              "_id", BCON_INT32(0),
              "score", "{",
                  "$meta", BCON_UTF8("searchScore"),
              "}",
          "}"
      );

      /* Create the aggregation pipeline array */
      pipeline = bson_new();
      int i = 0;

      /* Add each stage to the pipeline array */
      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, search_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, limit_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, project_stage);

      /* Set options (max time 5 seconds = 5000 ms) */
      mongoc_read_prefs_t *read_prefs = mongoc_read_prefs_new(MONGOC_READ_PRIMARY);
      mongoc_read_concern_t *read_concern = mongoc_read_concern_new();

      bson_t opts = BSON_INITIALIZER;
      bson_append_int32(&opts, "maxTimeMS", -1, 5000);

      /* Execute the aggregation */
      cursor = mongoc_collection_aggregate(
          collection,
          MONGOC_QUERY_NONE,
          pipeline,
          &opts,
          read_prefs
      );

      /* Display the results */
      while (mongoc_cursor_next(cursor, &doc)) {
          str = bson_as_canonical_extended_json(doc, NULL);
          printf("%s\n", str);
          bson_free(str);
      }

      /* Check if the cursor encountered any errors */
      if (mongoc_cursor_error(cursor, &error)) {
          fprintf(stderr, "Cursor Failure: %s\n", error.message);
          return EXIT_FAILURE;
      }

      /* Clean up */
      bson_destroy(text1);
      bson_destroy(text2);
      bson_destroy(should_array);
      bson_destroy(search_stage);
      bson_destroy(limit_stage);
      bson_destroy(project_stage);
      bson_destroy(pipeline);
      bson_destroy(&opts);
      mongoc_read_prefs_destroy(read_prefs);
      mongoc_read_concern_destroy(read_concern);
      mongoc_cursor_destroy(cursor);
      mongoc_collection_destroy(collection);
      mongoc_client_destroy(client);
      mongoc_cleanup();

      return EXIT_SUCCESS;
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Set up a CMake application

  To configure your application, create a `CMakeLists.txt` file in your project directory. Then, add the following code to the file:

  ```txt
  cmake_minimum_required(VERSION 3.11)
  project(atlas-search-project LANGUAGES C)
  add_executable (query.out synonyms_equivalent_query.c)
  find_package(mongoc <version> REQUIRED)
  target_link_libraries(query.out mongoc::mongoc)
  ```

  The preceding code performs the following actions:

  - Configures a C project.

  - Creates a `query.out` executable for your application.

  - Finds and requires the C driver. Replace the `<version>` placeholder with your C driver version synonyms, such as `2.0.0`.

  - Links the program to the `libmongoc` library.

  In the sample `CMakeLists.txt` file, the `mongoc::mongoc` target points to either the static library or the shared library. The library type depends on which one is available and whichever type the user specifies in the `MONGOC_DEFAULT_IMPORTED_LIBRARY_TYPE` CMake configuration setting. If you don't set this value and both library types are available, `mongoc::mongoc` uses the static library.

  You can use the `mongoc::static` target to explicitly use the static library or the `mongoc::shared` target to use the shared library.

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  cmake -S. -Bcmake-build
  cmake --build cmake-build --target query.out
  ./cmake-build/query.out
  ```

  ```none
  [{title The Dress} {score 4.812004089355469}]
  [{title Cars} {score 4.197734832763672}]
  [{title Dressed to Kill} {score 3.891493320465088}]
  [{title 27 Dresses} {score 3.891493320465088}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms_explicit_query.c`.

- Copy and paste the code example into the `synonyms_explicit_query.c` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```c
  #include <mongoc/mongoc.h>
  #include <stdio.h>
  #include <stdlib.h>

  int main(int argc, char *argv[])
  {
      mongoc_client_t *client;
      mongoc_collection_t *collection;
      mongoc_cursor_t *cursor;
      bson_error_t error;
      const bson_t *doc;
      bson_t *pipeline;
      char *str;

      /* Initialize the MongoDB C Driver */
      mongoc_init();

      /* Connect to MongoDB */
      client = mongoc_client_new("<connection-string>");
      if (!client) {
          fprintf(stderr, "Failed to parse URI.\n");
          return EXIT_FAILURE;
      }

      /* Get a handle on the collection */
      collection = mongoc_client_get_collection(client, "sample_mflix", "movies");

      /* Create the first text search clause for boat */
      bson_t *text1 = BCON_NEW(
          "text", "{",
              "path", BCON_UTF8("title"),
              "query", BCON_UTF8("boat"),
              "synonyms", BCON_UTF8("transportSynonyms"),
          "}"
      );

      /* Create the second text search clause for hat */
      bson_t *text2 = BCON_NEW(
          "text", "{",
              "path", BCON_UTF8("title"),
              "query", BCON_UTF8("hat"),
              "synonyms", BCON_UTF8("attireSynonyms"),
          "}"
      );

      /* Create the should array for compound search */
      bson_t *should_array = bson_new();
      char idx[16];
      const char *key;
      size_t idx_len;

      /* Add the text searches to the should array */
      idx_len = bson_uint32_to_string(0, &key, idx, sizeof(idx));
      bson_append_document(should_array, key, idx_len, text1);

      idx_len = bson_uint32_to_string(1, &key, idx, sizeof(idx));
      bson_append_document(should_array, key, idx_len, text2);

      /* Create the search stage directly with the should array */
      bson_t *search_stage = bson_new();
      bson_t search_doc, compound_doc;
      BSON_APPEND_DOCUMENT_BEGIN(search_stage, "$search", &search_doc);
      BSON_APPEND_UTF8(&search_doc, "index", "default_c");
      BSON_APPEND_DOCUMENT_BEGIN(&search_doc, "compound", &compound_doc);
      BSON_APPEND_ARRAY(&compound_doc, "should", should_array);
      bson_append_document_end(&search_doc, &compound_doc);
      bson_append_document_end(search_stage, &search_doc);

      /* Create the limit and project stages */
      bson_t *limit_stage = BCON_NEW("$limit", BCON_INT32(10));
      bson_t *project_stage = BCON_NEW(
          "$project", "{",
              "title", BCON_INT32(1),
              "_id", BCON_INT32(0),
              "score", "{",
                  "$meta", BCON_UTF8("searchScore"),
              "}",
          "}"
      );

      /* Create the aggregation pipeline array */
      pipeline = bson_new();
      int i = 0;

      /* Add each stage to the pipeline array */
      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, search_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, limit_stage);
      i++;

      idx_len = bson_uint32_to_string(i, &key, idx, sizeof idx);
      bson_append_document(pipeline, key, idx_len, project_stage);

      /* Set options (max time 5 seconds = 5000 ms) */
      mongoc_read_prefs_t *read_prefs = mongoc_read_prefs_new(MONGOC_READ_PRIMARY);
      mongoc_read_concern_t *read_concern = mongoc_read_concern_new();

      bson_t opts = BSON_INITIALIZER;
      bson_append_int32(&opts, "maxTimeMS", -1, 5000);

      /* Execute the aggregation */
      cursor = mongoc_collection_aggregate(
          collection,
          MONGOC_QUERY_NONE,
          pipeline,
          &opts,
          read_prefs
      );

      /* Display the results */
      while (mongoc_cursor_next(cursor, &doc)) {
          str = bson_as_canonical_extended_json(doc, NULL);
          printf("%s\n", str);
          bson_free(str);
      }

      /* Check if the cursor encountered any errors */
      if (mongoc_cursor_error(cursor, &error)) {
          fprintf(stderr, "Cursor Failure: %s\n", error.message);
          return EXIT_FAILURE;
      }

      /* Clean up */
      bson_destroy(text1);
      bson_destroy(text2);
      bson_destroy(should_array);
      bson_destroy(search_stage);
      bson_destroy(limit_stage);
      bson_destroy(project_stage);
      bson_destroy(pipeline);
      bson_destroy(&opts);
      mongoc_read_prefs_destroy(read_prefs);
      mongoc_read_concern_destroy(read_concern);
      mongoc_cursor_destroy(cursor);
      mongoc_collection_destroy(collection);
      mongoc_client_destroy(client);
      mongoc_cleanup();

      return EXIT_SUCCESS;
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Set up a CMake application

  To configure your application, create a `CMakeLists.txt` file in your project directory. Then, add the following code to the file:

  ```txt
  cmake_minimum_required(VERSION 3.11)
  project(atlas-search-project LANGUAGES C)
  add_executable (query.out synonyms_explicit_query.c)
  find_package(mongoc <version> REQUIRED)
  target_link_libraries(query.out mongoc::mongoc)
  ```

  The preceding code performs the following actions:

  - Configures a C project.

  - Creates a `query.out` executable for your application.

  - Finds and requires the C driver. Replace the `<version>` placeholder with your C driver version synonyms, such as `2.0.0`.

  - Links the program to the `libmongoc` library.

  In the sample `CMakeLists.txt` file, the `mongoc::mongoc` target points to either the static library or the shared library. The library type depends on which one is available and whichever type the user specifies in the `MONGOC_DEFAULT_IMPORTED_LIBRARY_TYPE` CMake configuration setting. If you don't set this value and both library types are available, `mongoc::mongoc` uses the static library.

  You can use the `mongoc::static` target to explicitly use the static library or the `mongoc::shared` target to use the shared library.

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  cmake -S. -Bcmake-build
  cmake --build cmake-build --target query.out
  ./cmake-build/query.out
  ```

  ```none
  [{title Fedora} {score 5.673145294189453}]
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Top Hat} {score 4.066137313842773}]
  [{title A Hatful of Rain} {score 4.066137313842773}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the C# Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB C# driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up and initialize the .NET/C# project.

In your terminal, navigate to where you want to create your application, then run the following command to create a directory called `atlas-search-project` and initialize your project in that directory:

```shell
# Create a new directory and initialize the project
mkdir atlas-search-project && cd atlas-search-project
dotnet new console

# Add the MongoDB .NET/C# Driver to your project
dotnet add package MongoDB.Driver
```

For more detailed installation instructions, see the [MongoDB C# Driver documentation](https://www.mongodb.com/docs/drivers/csharp/current/get-started/).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```csharp
using System;
using MongoDB.Bson;
using MongoDB.Driver;

namespace SynonymsTutorial
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                // Connection string to your MongoDB cluster
                string connectionString = "<connection-string>";

                // Create a MongoDB client
                var client = new MongoClient(connectionString);

                // Get the sample_mflix database
                var database = client.GetDatabase("sample_mflix");

                // Create the transport_synonyms collection
                try
                {
                    database.CreateCollection("transport_synonyms");
                }
                catch (MongoCommandException ex)
                {
                    // Collection may already exist, which is fine
                    Console.WriteLine($"Note: {ex.Message}");
                }

                var collection = database.GetCollection<BsonDocument>("transport_synonyms");

                // Create and insert the first document - equivalent mapping
                var doc1 = new BsonDocument
                {
                    { "mappingType", "equivalent" },
                    { "synonyms", new BsonArray { "car", "vehicle", "automobile" } }
                };

                collection.InsertOne(doc1);

                // Create and insert the second document - explicit mapping
                var doc2 = new BsonDocument
                {
                    { "mappingType", "explicit" },
                    { "input", new BsonArray { "boat" } },
                    { "synonyms", new BsonArray { "boat", "vessel", "sail" } }
                };

                collection.InsertOne(doc2);

                Console.WriteLine("Synonyms collections successfully created and populated.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Environment.Exit(1);
            }
        }
    }
}

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```csharp
using System;
using MongoDB.Bson;
using MongoDB.Driver;

namespace SynonymsTutorial
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                // Connection string to your MongoDB cluster
                string connectionString = "<connection-string>";

                // Create a MongoDB client
                var client = new MongoClient(connectionString);

                // Get the sample_mflix database
                var database = client.GetDatabase("sample_mflix");

                // Create the transport_synonyms collection
                try
                {
                    database.CreateCollection("transport_synonyms");
                }
                catch (MongoCommandException ex)
                {
                    // Collection may already exist, which is fine
                    Console.WriteLine($"Note: {ex.Message}");
                }

                var transportCollection = database.GetCollection<BsonDocument>("transport_synonyms");

                // Create and insert the first transport document - equivalent mapping
                var doc1 = new BsonDocument
                {
                    { "mappingType", "equivalent" },
                    { "synonyms", new BsonArray { "car", "vehicle", "automobile" } }
                };

                transportCollection.InsertOne(doc1);

                // Create and insert the second transport document - explicit mapping
                var doc2 = new BsonDocument
                {
                    { "mappingType", "explicit" },
                    { "input", new BsonArray { "boat" } },
                    { "synonyms", new BsonArray { "boat", "vessel", "sail" } }
                };

                transportCollection.InsertOne(doc2);

                // Create the attire_synonyms collection
                try
                {
                    database.CreateCollection("attire_synonyms");
                }
                catch (MongoCommandException ex)
                {
                    // Collection may already exist, which is fine
                    Console.WriteLine($"Note: {ex.Message}");
                }

                var attireCollection = database.GetCollection<BsonDocument>("attire_synonyms");

                // Create and insert the first attire document - equivalent mapping
                var doc3 = new BsonDocument
                {
                    { "mappingType", "equivalent" },
                    { "synonyms", new BsonArray { "dress", "apparel", "attire" } }
                };

                attireCollection.InsertOne(doc3);

                // Create and insert the second attire document - explicit mapping
                var doc4 = new BsonDocument
                {
                    { "mappingType", "explicit" },
                    { "input", new BsonArray { "hat" } },
                    { "synonyms", new BsonArray { "hat", "fedora", "headgear" } }
                };

                attireCollection.InsertOne(doc4);

                Console.WriteLine("Synonyms collections successfully created and populated.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error: {ex.Message}");
                Environment.Exit(1);
            }
        }
    }
}

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
dotnet run Program.cs
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Paste the following code into the `Program.cs` file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```csharp
using MongoDB.Bson;
using MongoDB.Driver;

// connect to your Atlas deployment
var uri = "<connection-string>";

var client = new MongoClient(uri);

var db = client.GetDatabase("sample_mflix");
var collection = db.GetCollection<BsonDocument>("movies");

// define your MongoDB Search index
var index = new CreateSearchIndexModel(
  "default", new BsonDocument
  {
    { "mappings", new BsonDocument
      {
        { "dynamic", false },
        { "fields", new BsonDocument
          {
            { "title", new BsonDocument
              {
                { "analyzer", "lucene.english" },
                { "type", "string" }
              }
            }
          }
        }
      }
    },
    { "synonyms", new BsonArray
      {
        new BsonDocument
        {
          { "analyzer", "lucene.english" },
          { "name", "transportSynonyms" },
          { "source", new BsonDocument
            {
              { "collection", "transport_synonyms" }
            }
          }
        }
      }
    }
  });

var result = collection.SearchIndexes.CreateOne(index);
Console.WriteLine($"New index name: {result}");
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Paste the following code into the `Program.cs` file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```csharp
using MongoDB.Bson;
using MongoDB.Driver;

// connect to your Atlas deployment
var uri = "<connection-string>";

var client = new MongoClient(uri);

var db = client.GetDatabase("sample_mflix");
var collection = db.GetCollection<BsonDocument>("movies");

// define your MongoDB Search index
var index = new CreateSearchIndexModel(
  "default", new BsonDocument
  {
    { "mappings", new BsonDocument
      {
        { "dynamic", false },
        { "fields", new BsonDocument
          {
            { "title", new BsonDocument
              {
                { "analyzer", "lucene.english" },
                { "type", "string" }
              }
            }
          }
        }
      }
    },
    { "synonyms", new BsonArray
      {
        new BsonDocument
        {
          { "analyzer", "lucene.english" },
          { "name", "transportSynonyms" },
          { "source", new BsonDocument
            {
              { "collection", "transport_synonyms" }
            }
          }
        },
        new BsonDocument
        {
          { "analyzer", "lucene.english" },
          { "name", "attireSynonyms" },
          { "source", new BsonDocument
            {
              { "collection", "attire_synonyms" }
            }
          }
        }
      }
    }
  });

var result = collection.SearchIndexes.CreateOne(index);
Console.WriteLine($"New index name: {result}");
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
dotnet run Program.cs
```

```
New index name: default
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `Program.cs`.

- Copy and paste the code example into the `Program.cs` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```csharp
  using MongoDB.Bson;
  using MongoDB.Driver;
  using System;
  using System.Threading.Tasks;

  class Program
  {
      static async Task Main(string[] args)
      {
          try
          {
              // Initialize the MongoDB C# driver
              var connectionString = "<connection-string>";
              var client = new MongoClient(connectionString);

              // Get a handle on the collection
              var database = client.GetDatabase("sample_mflix");
              var collection = database.GetCollection<BsonDocument>("movies");

              // Create pipeline stages
              var searchStage = new BsonDocument
              {
                  { "$search", new BsonDocument
                      {
                          { "index", "default" },
                          { "text", new BsonDocument
                              {
                                  { "path", "title" },
                                  { "query", "automobile" },
                                  { "synonyms", "transportSynonyms" }
                              }
                          }
                      }
                  }
              };

              var limitStage = new BsonDocument
              {
                  { "$limit", 10 }
              };

              var projectStage = new BsonDocument
              {
                  { "$project", new BsonDocument
                      {
                          { "title", 1 },
                          { "_id", 0 },
                          { "score", new BsonDocument
                              {
                                  { "$meta", "searchScore" }
                              }
                          }
                      }
                  }
              };

              // Create the aggregation pipeline
              var pipeline = new[] { searchStage, limitStage, projectStage };

              // Execute the aggregation
              using (var cursor = await collection.AggregateAsync<BsonDocument>(pipeline))
              {
                  // Display the results
                  await cursor.ForEachAsync(doc =>
                  {
                      Console.WriteLine(doc.ToJson());
                  });
              }
          }
          catch (Exception e)
          {
              Console.Error.WriteLine($"Error: {e.Message}");
              Environment.Exit(1);
          }
      }
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  dotnet run Program.cs
  ```

  ```
  [{title Cars} {score 4.197734832763672}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  [{title Cop Car} {score 3.39473032951355}]
  [{title The Cars That Eat People} {score 2.8496146202087402}]
  [{title Khrustalyov, My Car!} {score 2.8496146202087402}]
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `Program.cs`.

- Copy and paste the code example into the `Program.cs` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```csharp
  using MongoDB.Bson;
  using MongoDB.Driver;
  using System;
  using System.Threading.Tasks;

  class Program
  {
      static async Task Main(string[] args)
      {
          try
          {
              // Initialize the MongoDB C# driver
              var connectionString = "<connection-string>";
              var client = new MongoClient(connectionString);

              // Get a handle on the collection
              var database = client.GetDatabase("sample_mflix");
              var collection = database.GetCollection<BsonDocument>("movies");

              // Create pipeline stages
              var searchStage = new BsonDocument
              {
                  { "$search", new BsonDocument
                      {
                          { "index", "default" },
                          { "text", new BsonDocument
                              {
                                  { "path", "title" },
                                  { "query", "boat" },
                                  { "synonyms", "transportSynonyms" }
                              }
                          }
                      }
                  }
              };

              var limitStage = new BsonDocument
              {
                  { "$limit", 10 }
              };

              var projectStage = new BsonDocument
              {
                  { "$project", new BsonDocument
                      {
                          { "title", 1 },
                          { "_id", 0 },
                          { "score", new BsonDocument
                              {
                                  { "$meta", "searchScore" }
                              }
                          }
                      }
                  }
              };

              // Create the aggregation pipeline
              var pipeline = new[] { searchStage, limitStage, projectStage };

              // Set options (max time 5 seconds = 5000 ms)
              var options = new AggregateOptions
              {
                  MaxTime = TimeSpan.FromMilliseconds(5000)
              };

              // Execute the aggregation
              using (var cursor = await collection.AggregateAsync<BsonDocument>(pipeline, options))
              {
                  // Display the results
                  await cursor.ForEachAsync(doc =>
                  {
                      Console.WriteLine(doc.ToJson());
                  });
              }
          }
          catch (Exception e)
          {
              Console.Error.WriteLine($"Error: {e.Message}");
              Environment.Exit(1);
          }
      }
  }

  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  dotnet run Program.cs
  ```

  ```
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  [{title Three Men in a Boat} {score 3.1153182983398438}]
  [{title The Glass Bottom Boat} {score 3.1153182983398438}]
  [{title Jack Goes Boating} {score 3.1153182983398438}]
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index that contains multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `Program.cs`.

- Copy and paste the code example into the `Program.cs` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```csharp
  using MongoDB.Bson;
  using MongoDB.Driver;
  using System;
  using System.Threading.Tasks;

  class Program
  {
      static async Task Main(string[] args)
      {
          try
          {
              // Initialize the MongoDB C# driver
              var connectionString = "<connection-string>";
              var client = new MongoClient(connectionString);

              // Get a handle on the collection
              var database = client.GetDatabase("sample_mflix");
              var collection = database.GetCollection<BsonDocument>("movies");

              // Create the first text search clause for automobile
              var text1 = new BsonDocument
              {
                  { "text", new BsonDocument
                      {
                          { "path", "title" },
                          { "query", "automobile" },
                          { "synonyms", "transportSynonyms" }
                      }
                  }
              };

              // Create the second text search clause for attire
              var text2 = new BsonDocument
              {
                  { "text", new BsonDocument
                      {
                          { "path", "title" },
                          { "query", "attire" },
                          { "synonyms", "attireSynonyms" }
                      }
                  }
              };

              // Create the should array for compound search
              var shouldArray = new BsonArray
              {
                  text1,
                  text2
              };

              // Create the search stage with compound operator
              var searchStage = new BsonDocument
              {
                  { "$search", new BsonDocument
                      {
                          { "index", "default" },
                          { "compound", new BsonDocument
                              {
                                  { "should", shouldArray }
                              }
                          }
                      }
                  }
              };

              // Create the limit and project stages
              var limitStage = new BsonDocument
              {
                  { "$limit", 10 }
              };

              var projectStage = new BsonDocument
              {
                  { "$project", new BsonDocument
                      {
                          { "title", 1 },
                          { "_id", 0 },
                          { "score", new BsonDocument
                              {
                                  { "$meta", "searchScore" }
                              }
                          }
                      }
                  }
              };

              // Create the aggregation pipeline
              var pipeline = new[] { searchStage, limitStage, projectStage };

              // Set options (max time 5 seconds = 5000 ms)
              var options = new AggregateOptions
              {
                  MaxTime = TimeSpan.FromMilliseconds(5000)
              };

              // Execute the aggregation
              using (var cursor = await collection.AggregateAsync<BsonDocument>(pipeline, options))
              {
                  // Process and display the results
                  await cursor.ForEachAsync(doc =>
                  {
                      Console.WriteLine(doc.ToJson());
                  });
              }
          }
          catch (Exception e)
          {
              Console.Error.WriteLine($"Error: {e.Message}");
              Environment.Exit(1);
          }
      }
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  dotnet run Program.cs
  ```

  ```
  [{title The Dress} {score 4.812004089355469}]
  [{title Cars} {score 4.197734832763672}]
  [{title Dressed to Kill} {score 3.891493320465088}]
  [{title 27 Dresses} {score 3.891493320465088}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `Program.cs`.

- Copy and paste the code example into the `Program.cs` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```csharp
  using MongoDB.Bson;
  using MongoDB.Driver;
  using System;
  using System.Threading.Tasks;

  class Program
  {
      public static async Task<int> Main(string[] args)
      {
          try
          {
              // Connection string to your MongoDB deployment
              var connectionString = "<connection-string>";

              // Create a MongoDB client
              var client = new MongoClient(connectionString);

              // Get a handle on the database and collection
              var database = client.GetDatabase("sample_mflix");
              var collection = database.GetCollection<BsonDocument>("movies");

              // Create the first text search clause for boat
              var text1 = new BsonDocument
              {
                  { "text", new BsonDocument
                      {
                          { "path", "title" },
                          { "query", "boat" },
                          { "synonyms", "transportSynonyms" }
                      }
                  }
              };

              // Create the second text search clause for hat
              var text2 = new BsonDocument
              {
                  { "text", new BsonDocument
                      {
                          { "path", "title" },
                          { "query", "hat" },
                          { "synonyms", "attireSynonyms" }
                      }
                  }
              };

              // Create the search stage with compound operator using should array
              var shouldArray = new BsonArray { text1, text2 };

              // Create the search stage
              var searchStage = new BsonDocument
              {
                  { "$search", new BsonDocument
                      {
                          { "index", "default" },
                          { "compound", new BsonDocument
                              {
                                  { "should", shouldArray }
                              }
                          }
                      }
                  }
              };

              // Create the limit stage
              var limitStage = new BsonDocument
              {
                  { "$limit", 10 }
              };

              // Create the project stage
              var projectStage = new BsonDocument
              {
                  { "$project", new BsonDocument
                      {
                          { "title", 1 },
                          { "_id", 0 },
                          { "score", new BsonDocument
                              {
                                  { "$meta", "searchScore" }
                              }
                          }
                      }
                  }
              };

              // Create the aggregation pipeline
              var pipeline = new[] { searchStage, limitStage, projectStage };

              // Set options (max time 5 seconds = 5000 ms)
              var options = new AggregateOptions
              {
                  MaxTime = TimeSpan.FromMilliseconds(5000)
              };

              // Execute the aggregation
              using (var cursor = await collection.AggregateAsync<BsonDocument>(pipeline, options))
              {
                  // Process and display the results
                  await cursor.ForEachAsync(doc =>
                  {
                      Console.WriteLine(doc.ToJson());
                  });
              }

              return 0;
          }
          catch (Exception e)
          {
              Console.Error.WriteLine($"Error: {e.Message}");
              return 1;
          }
      }
  }
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  dotnet run Program.cs
  ```

  ```
  [{title Fedora} {score 5.673145294189453}]
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Top Hat} {score 4.066137313842773}]
  [{title A Hatful of Rain} {score 4.066137313842773}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the C++ Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB C++ driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up the C++ project.

In your terminal, navigate to where you want to create your application, then run the following command to create a directory called `atlas-search-project` for this project:

```shell
# Create a new directory for the project
mkdir atlas-search-project && cd atlas-search-project
```

For more detailed installation instructions, see the [MongoDB C++ Driver documentation](https://www.mongodb.com/docs/languages/cpp/cpp-driver/current/get-started/).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```cpp
#include <iostream>
#include <bsoncxx/builder/stream/document.hpp>
#include <bsoncxx/builder/stream/array.hpp>
#include <bsoncxx/json.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>
#include <mongocxx/exception/exception.hpp>

using bsoncxx::builder::stream::document;
using bsoncxx::builder::stream::array;
using bsoncxx::builder::stream::open_document;
using bsoncxx::builder::stream::close_document;
using bsoncxx::builder::stream::open_array;
using bsoncxx::builder::stream::close_array;
using bsoncxx::builder::stream::finalize;

int main() {
    try {
        // Initialize the MongoDB C++ driver
        mongocxx::instance instance{};

        // Create a MongoDB client
        const auto uri = mongocxx::uri{"<connection-string>"};
        mongocxx::client client{uri};

        // Get the sample_mflix database
        auto db = client["sample_mflix"];

        // Create the transport_synonyms collection
        try {
            db.create_collection("transport_synonyms");
        } catch (const mongocxx::exception& e) {
            // Collection may already exist, which is fine
            std::cerr << "Note: " << e.what() << std::endl;
        }

        auto collection = db["transport_synonyms"];

        // Create and insert the first document - equivalent mapping
        auto doc1 = document{}
            << "mappingType" << "equivalent"
            << "synonyms" << open_array
                << "car" << "vehicle" << "automobile"
            << close_array
            << finalize;

        collection.insert_one(doc1.view());

        // Create and insert the second document - explicit mapping
        auto doc2 = document{}
            << "mappingType" << "explicit"
            << "input" << open_array
                << "boat"
            << close_array
            << "synonyms" << open_array
                << "boat" << "vessel" << "sail"
            << close_array
            << finalize;

        collection.insert_one(doc2.view());

        std::cout << "Synonyms collections successfully created and populated." << std::endl;

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```cpp
#include <iostream>
#include <bsoncxx/builder/stream/document.hpp>
#include <bsoncxx/builder/stream/array.hpp>
#include <bsoncxx/json.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>
#include <mongocxx/exception/exception.hpp>

using bsoncxx::builder::stream::document;
using bsoncxx::builder::stream::array;
using bsoncxx::builder::stream::open_document;
using bsoncxx::builder::stream::close_document;
using bsoncxx::builder::stream::open_array;
using bsoncxx::builder::stream::close_array;
using bsoncxx::builder::stream::finalize;

int main() {
    try {
        // Initialize the MongoDB C++ driver
        mongocxx::instance instance{};

        // Create a MongoDB client
        const auto uri = mongocxx::uri{"<connection-string>"};
        mongocxx::client client{uri};

        // Get the sample_mflix database
        auto db = client["sample_mflix"];

        // Create the transport_synonyms collection
        try {
            db.create_collection("transport_synonyms");
        } catch (const mongocxx::exception& e) {
            // Collection may already exist, which is fine
            std::cerr << "Note: " << e.what() << std::endl;
        }

        auto transport_collection = db["transport_synonyms"];

        // Create and insert the first transport document - equivalent mapping
        auto doc1 = document{}
            << "mappingType" << "equivalent"
            << "synonyms" << open_array
                << "car" << "vehicle" << "automobile"
            << close_array
            << finalize;

        transport_collection.insert_one(doc1.view());

        // Create and insert the second transport document - explicit mapping
        auto doc2 = document{}
            << "mappingType" << "explicit"
            << "input" << open_array
                << "boat"
            << close_array
            << "synonyms" << open_array
                << "boat" << "vessel" << "sail"
            << close_array
            << finalize;

        transport_collection.insert_one(doc2.view());

        // Create the attire_synonyms collection
        try {
            db.create_collection("attire_synonyms");
        } catch (const mongocxx::exception& e) {
            // Collection may already exist, which is fine
            std::cerr << "Note: " << e.what() << std::endl;
        }

        auto attire_collection = db["attire_synonyms"];

        // Create and insert the first attire document - equivalent mapping
        auto doc3 = document{}
            << "mappingType" << "equivalent"
            << "synonyms" << open_array
                << "dress" << "apparel" << "attire"
            << close_array
            << finalize;

        attire_collection.insert_one(doc3.view());

        // Create and insert the second attire document - explicit mapping
        auto doc4 = document{}
            << "mappingType" << "explicit"
            << "input" << open_array
                << "hat"
            << close_array
            << "synonyms" << open_array
                << "hat" << "fedora" << "headgear"
            << close_array
            << finalize;

        attire_collection.insert_one(doc4.view());

        std::cout << "Synonyms collections successfully created and populated." << std::endl;

    } catch (const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return EXIT_FAILURE;
    }

    return EXIT_SUCCESS;
}

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
c++ --std=c++17 FileName.cpp $(pkg-config --cflags --libs libmongocxx) -o ./app.out
./app.out
```

```
Synonyms collections successfully created and populated.
```

MacOS users might see the following error after running the preceding commands:

```sh
dyld[54430]: Library not loaded: @rpath/libmongocxx._noabi.dylib
```

To resolve this error, use the `-Wl`,``-rpath`` linker option to set the `@rpath`, as shown in the following code:

```sh
c++ --std=c++17 FileName.cpp -Wl,-rpath,/usr/local/lib/ $(pkg-config --cflags --libs libmongocxx) -o ./app.out
./app.out
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `CreateIndex.cpp` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```cpp
#include <iostream>

#include <bsoncxx/builder/basic/document.hpp>
#include <bsoncxx/builder/basic/array.hpp>
#include <bsoncxx/json.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>

using bsoncxx::builder::basic::kvp;
using bsoncxx::builder::basic::make_document;
using bsoncxx::builder::basic::make_array;

int main(){

    mongocxx::instance instance;
    mongocxx::uri uri("<connection string>");
    mongocxx::client client(uri);

    auto db = client["sample_mflix"];
    auto collection = db["movies"];

    // instantiate a ``mongocxx::search_index_view`` on your collection
    auto siv = collection.search_indexes();

    {
        auto name = "default";
        auto definition = make_document(
            kvp("mappings", make_document(
                kvp("dynamic", false),
                kvp("fields", make_document(
                    kvp("title", make_document(
                        kvp("analyzer", "lucene.english"),
                        kvp("type", "string")
                    ))
                ))
            )),
            kvp("synonyms", make_array(
                make_document(
                    kvp("analyzer", "lucene.english"),
                    kvp("name", "transportSynonyms"),
                    kvp("source", make_document(
                        kvp("collection", "transport_synonyms")
                    ))
                )
            ))
        );

        auto model = mongocxx::search_index_model(name, definition.view());

        // Create the search index
        auto result = siv.create_one(model);
        std::cout << "New index name: " << result << std::endl;
    }
}
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `CreateIndexMultiple.cpp` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```cpp
#include <iostream>

#include <bsoncxx/builder/basic/document.hpp>
#include <bsoncxx/builder/basic/array.hpp>
#include <bsoncxx/json.hpp>
#include <mongocxx/client.hpp>
#include <mongocxx/instance.hpp>
#include <mongocxx/uri.hpp>

using bsoncxx::builder::basic::kvp;
using bsoncxx::builder::basic::make_document;
using bsoncxx::builder::basic::make_array;

int main(){

    mongocxx::instance instance;
    mongocxx::uri uri("<connection-string>");
    mongocxx::client client(uri);

    auto db = client["sample_mflix"];
    auto collection = db["movies"];

    // instantiate a ``mongocxx::search_index_view`` on your collection
    auto siv = collection.search_indexes();

    {
        auto name = "default";
        auto definition = make_document(
            kvp("mappings", make_document(
                kvp("dynamic", false),
                kvp("fields", make_document(
                    kvp("title", make_document(
                        kvp("analyzer", "lucene.english"),
                        kvp("type", "string")
                    ))
                ))
            )),
            kvp("synonyms", make_array(
                make_document(
                    kvp("analyzer", "lucene.english"),
                    kvp("name", "transportSynonyms"),
                    kvp("source", make_document(
                        kvp("collection", "transport_synonyms")
                    ))
                ),
                make_document(
                    kvp("analyzer", "lucene.english"),
                    kvp("name", "attireSynonyms"),
                    kvp("source", make_document(
                        kvp("collection", "attire_synonyms")
                    ))
                )
            ))
        );

        auto model = mongocxx::search_index_model(name, definition.view());

        // Create the search index
        auto result = siv.create_one(model);
        std::cout << "New index name: " << result << std::endl;
    }
}
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
c++ --std=c++17 FileName.cpp $(pkg-config --cflags --libs libmongocxx) -o ./app.out
./app.out
```

```
New index name: default
```

MacOS users might see the following error after running the preceding commands:

```sh
dyld[54430]: Library not loaded: @rpath/libmongocxx._noabi.dylib
```

To resolve this error, use the `-Wl`,``-rpath`` linker option to set the `@rpath`, as shown in the following code:

```sh
c++ --std=c++17 FileName.cpp -Wl,-rpath,/usr/local/lib/ $(pkg-config --cflags --libs libmongocxx) -o ./app.out
./app.out
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `SynonymsEquivalentQuery.cpp`.

- Copy and paste the code example into the `SynonymsEquivalentQuery.cpp` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```cpp
  #include <mongocxx/client.hpp>
  #include <mongocxx/instance.hpp>
  #include <mongocxx/uri.hpp>
  #include <mongocxx/pipeline.hpp>
  #include <bsoncxx/builder/stream/document.hpp>
  #include <bsoncxx/json.hpp>
  #include <iostream>
  #include <string>
  #include <vector>

  int main(int argc, char* argv[]) {
      try {
          // Initialize the MongoDB C++ driver
          mongocxx::instance instance{};

          // Connect to MongoDB
          mongocxx::uri uri("<connection-string>");
          mongocxx::client client(uri);

          // Get a handle on the collection
          mongocxx::database db = client["sample_mflix"];
          mongocxx::collection collection = db["movies"];

          // Build the aggregation pipeline using the stream builder
          using namespace bsoncxx::builder::stream;

          // Create pipeline stages
          auto search_stage = document{} << "$search" << open_document
              << "index" << "default"
              << "text" << open_document
                  << "path" << "title"
                  << "query" << "automobile"
                  << "synonyms" << "transportSynonyms"
              << close_document
          << close_document << finalize;

          auto limit_stage = document{} << "$limit" << 10 << finalize;

          auto project_stage = document{} << "$project" << open_document
              << "title" << 1
              << "_id" << 0
              << "score" << open_document
                  << "$meta" << "searchScore"
              << close_document
          << close_document << finalize;

          // Create the pipeline using mongocxx::pipeline
          mongocxx::pipeline pipeline;
          pipeline.append_stage(search_stage.view());
          pipeline.append_stage(limit_stage.view());
          pipeline.append_stage(project_stage.view());

          // Execute the aggregation
          mongocxx::cursor cursor = collection.aggregate(pipeline);

          // Process and display the results
          for (auto&& doc : cursor) {
              std::cout << bsoncxx::to_json(doc) << std::endl;
          }

          return EXIT_SUCCESS;

      } catch (const std::exception& e) {
          std::cerr << "Error: " << e.what() << std::endl;
          return EXIT_FAILURE;
      }
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  c++ --std=c++17 SynonymsEquivalentQuery.cpp $(pkg-config --cflags --libs libmongocxx) -o ./app.out
  ./app.out
  ```

  ```
  [{title Cars} {score 4.197734832763672}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  [{title Cop Car} {score 3.39473032951355}]
  [{title The Cars That Eat People} {score 2.8496146202087402}]
  [{title Khrustalyov, My Car!} {score 2.8496146202087402}]
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `SynonymsExplicitQuery.cpp`.

- Copy and paste the code example into the `SynonymsExplicitQuery.cpp` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```cpp
  #include <mongocxx/client.hpp>
  #include <mongocxx/instance.hpp>
  #include <mongocxx/uri.hpp>
  #include <mongocxx/pipeline.hpp>
  #include <bsoncxx/builder/stream/document.hpp>
  #include <bsoncxx/json.hpp>
  #include <iostream>
  #include <string>
  #include <vector>

  int main(int argc, char* argv[]) {
      try {
          // Initialize the MongoDB C++ driver
          mongocxx::instance instance{};

          // Connect to MongoDB
          mongocxx::uri uri("<connection-string>");
          mongocxx::client client(uri);

          // Get a handle on the collection
          mongocxx::database db = client["sample_mflix"];
          mongocxx::collection collection = db["movies"];

          // Build the aggregation pipeline using the stream builder
          using namespace bsoncxx::builder::stream;

          // Create pipeline stages
          auto search_stage = document{} << "$search" << open_document
              << "index" << "default"
              << "text" << open_document
                  << "path" << "title"
                  << "query" << "boat"
                  << "synonyms" << "transportSynonyms"
              << close_document
          << close_document << finalize;

          auto limit_stage = document{} << "$limit" << 10 << finalize;

          auto project_stage = document{} << "$project" << open_document
              << "title" << 1
              << "_id" << 0
              << "score" << open_document
                  << "$meta" << "searchScore"
              << close_document
          << close_document << finalize;

          // Create the pipeline using mongocxx::pipeline
          mongocxx::pipeline pipeline;
          pipeline.append_stage(search_stage.view());
          pipeline.append_stage(limit_stage.view());
          pipeline.append_stage(project_stage.view());

          // Execute the aggregation
          mongocxx::cursor cursor = collection.aggregate(pipeline);

          // Process and display the results
          for (auto&& doc : cursor) {
              std::cout << bsoncxx::to_json(doc) << std::endl;
          }

          return EXIT_SUCCESS;

      } catch (const std::exception& e) {
          std::cerr << "Error: " << e.what() << std::endl;
          return EXIT_FAILURE;
      }
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  c++ --std=c++17 SynonymsExplicitQuery.cpp $(pkg-config --cflags --libs libmongocxx) -o ./app.out
  ./app.out
  ```

  ```
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  [{title Three Men in a Boat} {score 3.1153182983398438}]
  [{title The Glass Bottom Boat} {score 3.1153182983398438}]
  [{title Jack Goes Boating} {score 3.1153182983398438}]
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

MacOS users might see the following error after running the preceding commands:

```sh
dyld[54430]: Library not loaded: @rpath/libmongocxx._noabi.dylib
```

To resolve this error, use the `-Wl`,``-rpath`` linker option to set the `@rpath`, as shown in the following code:

```sh
c++ --std=c++17 SynonymsEquivalentQuery.cpp -Wl,-rpath,/usr/local/lib/ $(pkg-config --cflags --libs libmongocxx) -o ./app.out
./app.out
```

## Run advanced MongoDB Search queries if you created the index that contains multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `SynonymsEquivalentQuery.cpp`.

- Copy and paste the code example into the `SynonymsEquivalentQuery.cpp` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```cpp
  #include <mongocxx/client.hpp>
  #include <mongocxx/instance.hpp>
  #include <mongocxx/uri.hpp>
  #include <mongocxx/pipeline.hpp>
  #include <bsoncxx/json.hpp>
  #include <bsoncxx/builder/stream/document.hpp>
  #include <bsoncxx/builder/stream/array.hpp>
  #include <bsoncxx/exception/exception.hpp>
  #include <iostream>
  #include <string>
  #include <chrono>

  int main(int argc, char* argv[]) {
      try {
          // Initialize the MongoDB C++ Driver
          mongocxx::instance instance{};

          // Connect to MongoDB
          mongocxx::uri uri("<connection-string>");
          mongocxx::client client(uri);

          // Get a handle on the collection
          mongocxx::database db = client["sample_mflix"];
          mongocxx::collection collection = db["movies"];

          // Use C++ stream builders for BSON documents
          using bsoncxx::builder::stream::document;
          using bsoncxx::builder::stream::open_document;
          using bsoncxx::builder::stream::close_document;
          using bsoncxx::builder::stream::open_array;
          using bsoncxx::builder::stream::close_array;
          using bsoncxx::builder::stream::finalize;
          using bsoncxx::builder::stream::array;

          // Create the first text search clause for automobile
          auto text1 = document{} << "text" << open_document
              << "path" << "title"
              << "query" << "automobile"
              << "synonyms" << "transportSynonyms"
              << close_document << finalize;

          // Create the second text search clause for attire
          auto text2 = document{} << "text" << open_document
              << "path" << "title"
              << "query" << "attire"
              << "synonyms" << "attireSynonyms"
              << close_document << finalize;

          // Create the should array for compound search
          auto should_array = array{}
              << text1.view()
              << text2.view()
              << finalize;

          // Create pipeline stages
          auto search_stage = document{} << "$search" << open_document
              << "index" << "default"
              << "compound" << open_document
                  << "should" << should_array.view()
              << close_document
          << close_document << finalize;

          auto limit_stage = document{} << "$limit" << 10 << finalize;

          auto project_stage = document{} << "$project" << open_document
              << "title" << 1
              << "_id" << 0
              << "score" << open_document
                  << "$meta" << "searchScore"
              << close_document
          << close_document << finalize;

          // Create the pipeline using mongocxx::pipeline
          mongocxx::pipeline pipeline;
          pipeline.append_stage(search_stage.view());
          pipeline.append_stage(limit_stage.view());
          pipeline.append_stage(project_stage.view());

          // Set options (max time 5 seconds = 5000 ms)
          mongocxx::options::aggregate options;
          options.max_time(std::chrono::milliseconds(5000));

          // Execute the aggregation
          mongocxx::cursor cursor = collection.aggregate(pipeline, options);

          // Process and display the results
          for (auto&& doc : cursor) {
              std::cout << bsoncxx::to_json(doc) << std::endl;
          }

          return EXIT_SUCCESS;

      } catch (const std::exception& e) {
          std::cerr << "Error: " << e.what() << std::endl;
          return EXIT_FAILURE;
      }
  }
  ```

- Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

  <Tabs>

  <Tab name="Atlas Cluster">

  Your connection string should use the following format:

  ```
  mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
  ```

  To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

  </Tab>

  <Tab name="Local or Self-Managed">

  Your connection string should use the following format:

  ```
  mongodb://localhost:<port-number>/?directConnection=true
  ```

  To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

  </Tab>

  </Tabs>

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  c++ --std=c++17 SynonymsEquivalentQuery.cpp $(pkg-config --cflags --libs libmongocxx) -o ./app.out
  ./app.out
  ```

  ```
  [{title The Dress} {score 4.812004089355469}]
  [{title Cars} {score 4.197734832763672}]
  [{title Dressed to Kill} {score 3.891493320465088}]
  [{title 27 Dresses} {score 3.891493320465088}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `SynonymsExplicitQuery.cpp`.

- Copy and paste the code example into the `SynonymsExplicitQuery.cpp` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```cpp
  #include <mongocxx/client.hpp>
  #include <mongocxx/instance.hpp>
  #include <mongocxx/uri.hpp>
  #include <mongocxx/pipeline.hpp>
  #include <mongocxx/options/aggregate.hpp>
  #include <bsoncxx/json.hpp>
  #include <bsoncxx/builder/stream/document.hpp>
  #include <bsoncxx/builder/stream/array.hpp>
  #include <bsoncxx/exception/exception.hpp>
  #include <iostream>
  #include <string>
  #include <chrono>

  int main(int argc, char* argv[]) {
      try {
          // Initialize the MongoDB C++ Driver
          mongocxx::instance instance{};

          // Connect to MongoDB
          mongocxx::uri uri("<connection-string>");
          mongocxx::client client(uri);

          // Get a handle on the collection
          mongocxx::database db = client["sample_mflix"];
          mongocxx::collection collection = db["movies"];

          // Use C++ stream builders for BSON documents
          using bsoncxx::builder::stream::document;
          using bsoncxx::builder::stream::open_document;
          using bsoncxx::builder::stream::close_document;
          using bsoncxx::builder::stream::open_array;
          using bsoncxx::builder::stream::close_array;
          using bsoncxx::builder::stream::finalize;

          // Create the first text search clause for boat
          auto text1 = document{} << "text" << open_document
              << "path" << "title"
              << "query" << "boat"
              << "synonyms" << "transportSynonyms"
              << close_document << finalize;

          // Create the second text search clause for hat
          auto text2 = document{} << "text" << open_document
              << "path" << "title"
              << "query" << "hat"
              << "synonyms" << "attireSynonyms"
              << close_document << finalize;

          // Create the search stage with compound operator using should array instead of must
          auto should_array = bsoncxx::builder::stream::array{}
              << text1.view()
              << text2.view()
              << finalize;

          // Create pipeline stages
          auto search_stage = document{} << "$search" << open_document
              << "index" << "default"
              << "compound" << open_document
                  << "should" << should_array.view()
              << close_document
          << close_document << finalize;

          auto limit_stage = document{} << "$limit" << 10 << finalize;

          auto project_stage = document{} << "$project" << open_document
              << "title" << 1
              << "_id" << 0
              << "score" << open_document
                  << "$meta" << "searchScore"
              << close_document
          << close_document << finalize;

          // Create the pipeline using mongocxx::pipeline
          mongocxx::pipeline pipeline;
          pipeline.append_stage(search_stage.view());
          pipeline.append_stage(limit_stage.view());
          pipeline.append_stage(project_stage.view());

          // Set options (max time 5 seconds = 5000 ms)
          mongocxx::options::aggregate options;
          options.max_time(std::chrono::milliseconds(5000));

          // Execute the aggregation
          mongocxx::cursor cursor = collection.aggregate(pipeline, options);

          // Process and display the results
          for (auto&& doc : cursor) {
              std::cout << bsoncxx::to_json(doc) << std::endl;
          }

          return EXIT_SUCCESS;

      } catch (const std::exception& e) {
          std::cerr << "Error: " << e.what() << std::endl;
          return EXIT_FAILURE;
      }
  }
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the query.

  In your terminal, run the following commands to build and run this application:

  ```shell
  c++ --std=c++17 SynonymsExplicitQuery.cpp $(pkg-config --cflags --libs libmongocxx) -o ./app.out
  ./app.out
  ```

  ```
  [{title Fedora} {score 5.673145294189453}]
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Top Hat} {score 4.066137313842773}]
  [{title A Hatful of Rain} {score 4.066137313842773}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

MacOS users might see the following error after running the preceding commands:

```sh
dyld[54430]: Library not loaded: @rpath/libmongocxx._noabi.dylib
```

To resolve this error, use the `-Wl`,``-rpath`` linker option to set the `@rpath`, as shown in the following code:

```sh
c++ --std=c++17 SynonymsExplicitQuery.cpp -Wl,-rpath,/usr/local/lib/ $(pkg-config --cflags --libs libmongocxx) -o ./app.out
./app.out
```

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the Go Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB Go driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up and initialize the Go module.

In your terminal, navigate to where you want to create your application, then run the following command to create a directory called `atlas-search-project` and initialize your project in that directory:

```shell
# Create a new directory and initialize the project
mkdir atlas-search-project && cd atlas-search-project
go mod init atlas-search-project

# Add the MongoDB Go Driver to your project
go get go.mongodb.org/mongo-driver/v2/mongo
```

For more detailed installation instructions, see the [MongoDB Go Driver documentation](https://www.mongodb.com/docs/drivers/go/current/get-started/#std-label-go-get-started).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

func main() {
	// Create a context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to MongoDB
	uri := "<connection-string>"
	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		if err = client.Disconnect(ctx); err != nil {
			log.Fatal(err)
		}
	}()

	// Check the connection
	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		log.Fatal(err)
	}

	// Get the sample_mflix database
	database := client.Database("sample_mflix")

	// Create the transport_synonyms collection
	err = database.CreateCollection(ctx, "transport_synonyms")
	if err != nil {
		// Collection may already exist, which is fine
		fmt.Printf("Note: %v\n", err)
	}

	// Get the collection
	collection := database.Collection("transport_synonyms")

	// Create and insert the first document - equivalent mapping
	doc1 := bson.D{
		{"mappingType", "equivalent"},
		{"synonyms", bson.A{"car", "vehicle", "automobile"}},
	}

	_, err = collection.InsertOne(ctx, doc1)
	if err != nil {
		log.Fatal(err)
	}

	// Create and insert the second document - explicit mapping
	doc2 := bson.D{
		{"mappingType", "explicit"},
		{"input", bson.A{"boat"}},
		{"synonyms", bson.A{"boat", "vessel", "sail"}},
	}

	_, err = collection.InsertOne(ctx, doc2)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Synonyms collections successfully created and populated.")
}
```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```go
package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
	"go.mongodb.org/mongo-driver/v2/mongo/readpref"
)

func main() {
	// Create a context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Connect to MongoDB
	uri := "<connection-string>"
	client, err := mongo.Connect(options.Client().ApplyURI(uri))
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		if err = client.Disconnect(ctx); err != nil {
			log.Fatal(err)
		}
	}()

	// Check the connection
	err = client.Ping(ctx, readpref.Primary())
	if err != nil {
		log.Fatal(err)
	}

	// Get the sample_mflix database
	database := client.Database("sample_mflix")

	// Create the transport_synonyms collection
	err = database.CreateCollection(ctx, "transport_synonyms")
	if err != nil {
		// Collection may already exist, which is fine
		fmt.Printf("Note: %v\n", err)
	}

	// Get the transport_synonyms collection
	transportCollection := database.Collection("transport_synonyms")

	// Create and insert the first transport document - equivalent mapping
	doc1 := bson.D{
		{"mappingType", "equivalent"},
		{"synonyms", bson.A{"car", "vehicle", "automobile"}},
	}

	_, err = transportCollection.InsertOne(ctx, doc1)
	if err != nil {
		log.Fatal(err)
	}

	// Create and insert the second transport document - explicit mapping
	doc2 := bson.D{
		{"mappingType", "explicit"},
		{"input", bson.A{"boat"}},
		{"synonyms", bson.A{"boat", "vessel", "sail"}},
	}

	_, err = transportCollection.InsertOne(ctx, doc2)
	if err != nil {
		log.Fatal(err)
	}

	// Create the attire_synonyms collection
	err = database.CreateCollection(ctx, "attire_synonyms")
	if err != nil {
		// Collection may already exist, which is fine
		fmt.Printf("Note: %v\n", err)
	}

	// Get the attire_synonyms collection
	attireCollection := database.Collection("attire_synonyms")

	// Create and insert the first attire document - equivalent mapping
	doc3 := bson.D{
		{"mappingType", "equivalent"},
		{"synonyms", bson.A{"dress", "apparel", "attire"}},
	}

	_, err = attireCollection.InsertOne(ctx, doc3)
	if err != nil {
		log.Fatal(err)
	}

	// Create and insert the second attire document - explicit mapping
	doc4 := bson.D{
		{"mappingType", "explicit"},
		{"input", bson.A{"hat"}},
		{"synonyms", bson.A{"hat", "fedora", "headgear"}},
	}

	_, err = attireCollection.InsertOne(ctx, doc4)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Synonyms collections successfully created and populated.")
}

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
go run file_name.go
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `create_index.go` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```go
package main

import (
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func main() {
	ctx := context.Background()
	uri := "<connection-string>"
	client, err := mongo.Connect(options.Client().
		ApplyURI(uri))
	if err != nil {
		panic(err)
	}

	defer func() {
		if err := client.Disconnect(context.TODO()); err != nil {
			panic(err)
		}
	}()

	coll := client.Database("sample_mflix").Collection("movies")
	const indexName = "default"
	opts := options.SearchIndexes().SetName(indexName).SetType("search")

	// Define the MongoDB Search index
	searchIndexModel := mongo.SearchIndexModel{
		Definition: bson.D{
			{"mappings", bson.D{
				{"dynamic", false},
				{"fields", bson.D{
					{"title", bson.D{
						{"analyzer", "lucene.english"},
						{"type", "string"},
					}},
				}},
			}},
			{"synonyms", bson.A{
				bson.D{
					{"analyzer", "lucene.english"},
					{"name", "transportSynonyms"},
					{"source", bson.D{
						{"collection", "transport_synonyms"},
					}},
				},
			}},
		},
		Options: opts,
	}

	// Create the index
	searchIndexName, err := coll.SearchIndexes().CreateOne(ctx, searchIndexModel)
	if err != nil {
		log.Fatalf("Failed to create the Atlas Search index: %v", err)
	}

	fmt.Println("New index name: " + searchIndexName)
}
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `create_index_multiple.go` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```go
package main

import (
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/v2/bson"
	"go.mongodb.org/mongo-driver/v2/mongo"
	"go.mongodb.org/mongo-driver/v2/mongo/options"
)

func main() {
	ctx := context.Background()
	uri := "<connection-string>"
	client, err := mongo.Connect(options.Client().
		ApplyURI(uri))
	if err != nil {
		panic(err)
	}

	defer func() {
		if err := client.Disconnect(context.TODO()); err != nil {
			panic(err)
		}
	}()

	coll := client.Database("sample_mflix").Collection("movies")
	const indexName = "default"
	opts := options.SearchIndexes().SetName(indexName).SetType("search")

	// Define the MongoDB Search index
	searchIndexModel := mongo.SearchIndexModel{
		Definition: bson.D{
			{"mappings", bson.D{
				{"dynamic", false},
				{"fields", bson.D{
					{"title", bson.D{
						{"analyzer", "lucene.english"},
						{"type", "string"},
					}},
				}},
			}},
			{"synonyms", bson.A{
				bson.D{
					{"analyzer", "lucene.english"},
					{"name", "transportSynonyms"},
					{"source", bson.D{
						{"collection", "transport_synonyms"},
					}},
				},
				bson.D{
					{"analyzer", "lucene.english"},
					{"name", "attireSynonyms"},
					{"source", bson.D{
						{"collection", "attire_synonyms"},
					}},
				},
			}},
		},
		Options: opts,
	}

	// Create the index
	searchIndexName, err := coll.SearchIndexes().CreateOne(ctx, searchIndexModel)
	if err != nil {
		log.Fatalf("Failed to create the Atlas Search index: %v", err)
	}

	fmt.Println("New index name: " + searchIndexName)
}
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
go run file_name.go
```

```
New index name: default
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms-equivalent-query.go`.

- Copy and paste the code example into the `synonyms-equivalent-query.go` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```go
  package main

  import (
  	"context"
  	"fmt"
  	"time"

  	"go.mongodb.org/mongo-driver/v2/bson"
  	"go.mongodb.org/mongo-driver/v2/mongo"
  	"go.mongodb.org/mongo-driver/v2/mongo/options"
  )

  // define structure of movies collection
  type MovieCollection struct {
  	title string `bson:"Title,omitempty"`
  }

  func main() {
  	var err error
  	// connect to the Atlas cluster
  	ctx := context.Background()
  	client, err := mongo.Connect(options.Client().ApplyURI("<connection-string>"))
  	if err != nil {
  		panic(err)
  	}
  	defer client.Disconnect(ctx)

  	// set namespace
  	collection := client.Database("sample_mflix").Collection("movies")

  	// define pipeline
  	searchStage := bson.D{{"$search", bson.D{{"index", "default"}, {"text", bson.D{{"path", "title"}, {"query", "automobile"}, {"synonyms", "transportSynonyms"}}}}}}
  	limitStage := bson.D{{"$limit", 10}}
  	projectStage := bson.D{{"$project", bson.D{{"title", 1}, {"_id", 0}, {"score", bson.D{{"$meta", "searchScore"}}}}}}

  	// specify the amount of time the operation can run on the server
  	opts := options.Aggregate()

  	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
  	defer cancel()

  	cursor, err := collection.Aggregate(ctx, mongo.Pipeline{searchStage, limitStage, projectStage}, opts)
  	if err != nil {
  		panic(err)
  	}

  	// print results
  	var results []bson.D
  	if err = cursor.All(ctx, &results); err != nil {
  		panic(err)
  	}
  	for _, result := range results {
  		fmt.Println(result)
  	}
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the following command to query your collection:

  ```sh
  go run synonyms-equivalent-query.go
  ```

  When you run `synonyms-equivalent-query.go`, the program prints the following documents to your terminal:

  ```none
  [{title Cars} {score 4.197734832763672}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  [{title Cop Car} {score 3.39473032951355}]
  [{title The Cars That Eat People} {score 2.8496146202087402}]
  [{title Khrustalyov, My Car!} {score 2.8496146202087402}]
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms-explicit-query.go`.

- Copy and paste the code example into the `synonyms-explicit-query.go` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```go
  package main

  import (
  	"context"
  	"fmt"
  	"time"

  	"go.mongodb.org/mongo-driver/v2/bson"
  	"go.mongodb.org/mongo-driver/v2/mongo"
  	"go.mongodb.org/mongo-driver/v2/mongo/options"
  )

  // define structure of movies collection
  type MovieCollection struct {
  	title string `bson:"Title,omitempty"`
  }

  func main() {
  	var err error
  	// connect to the Atlas cluster
  	ctx := context.Background()
  	client, err := mongo.Connect(options.Client().ApplyURI("<connection-string>"))
  	if err != nil {
  		panic(err)
  	}
  	defer client.Disconnect(ctx)
  	// set namespace
  	collection := client.Database("sample_mflix").Collection("movies")
  	// define pipeline
  	searchStage := bson.D{{"$search", bson.D{{"index", "default"}, {"text", bson.D{{"path", "title"}, {"query", "boat"}, {"synonyms", "transportSynonyms"}}}}}}
  	limitStage := bson.D{{"$limit", 10}}
  	projectStage := bson.D{{"$project", bson.D{{"title", 1}, {"_id", 0}, {"score", bson.D{{"$meta", "searchScore"}}}}}}
  	// specify the amount of time the operation can run on the server
  	opts := options.Aggregate()

  	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
  	defer cancel()

  	cursor, err := collection.Aggregate(ctx, mongo.Pipeline{searchStage, limitStage, projectStage}, opts)
  	if err != nil {
  		panic(err)
  	}
  	// print results
  	var results []bson.D
  	if err = cursor.All(ctx, &results); err != nil {
  		panic(err)
  	}
  	for _, result := range results {
  		fmt.Println(result)
  	}
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the following command to query your collection:

  ```bash
  go run synonyms-explicit-query.go
  ```

  ```none
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  [{title Three Men in a Boat} {score 3.1153182983398438}]
  [{title The Glass Bottom Boat} {score 3.1153182983398438}]
  [{title Jack Goes Boating} {score 3.1153182983398438}]
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index that contains multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms-equivalent-query.go`.

- Copy and paste the code example into the `synonyms-equivalent-query.go` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```go
  package main

  import (
  	"context"
  	"fmt"
  	"time"

  	"go.mongodb.org/mongo-driver/v2/bson"
  	"go.mongodb.org/mongo-driver/v2/mongo"
  	"go.mongodb.org/mongo-driver/v2/mongo/options"
  )

  // define structure of movies collection
  type MovieCollection struct {
  	title string `bson:"Title,omitempty"`
  }

  func main() {
  	var err error
  	// connect to the Atlas cluster
  	ctx := context.Background()
  	client, err := mongo.Connect(options.Client().ApplyURI("<connection-string>"))
  	if err != nil {
  		panic(err)
  	}
  	defer client.Disconnect(ctx)
  	// set namespace
  	collection := client.Database("sample_mflix").Collection("movies")
  	// define pipeline
  	searchStage := bson.D{{"$search", bson.M{
  		"index": "default",
  		"compound": bson.M{
  			"should": bson.A{
  				bson.M{
  					"text": bson.D{
  						{"path", "title"}, {"query", "automobile"}, {"synonyms", "transportSynonyms"},
  					},
  				},
  				bson.M{
  					"text": bson.D{
  						{"path", "title"}, {"query", "attire"}, {"synonyms", "attireSynonyms"},
  					},
  				},
  			},
  		},
  	}}}
  	limitStage := bson.D{{"$limit", 10}}
  	projectStage := bson.D{{"$project", bson.D{{"title", 1}, {"_id", 0}, {"score", bson.D{{"$meta", "searchScore"}}}}}}
  	// specify the amount of time the operation can run on the server
  	opts := options.Aggregate()

  	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
  	defer cancel()

  	// run pipeline
  	cursor, err := collection.Aggregate(ctx, mongo.Pipeline{searchStage, limitStage, projectStage}, opts)
  	if err != nil {
  		panic(err)
  	}
  	// print results
  	var results []bson.D
  	if err = cursor.All(ctx, &results); err != nil {
  		panic(err)
  	}
  	for _, result := range results {
  		fmt.Println(result)
  	}
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the following command to query your collection:

  ```bash
  go run synonyms-equivalent-query.go
  ```

  ```none
  [{title The Dress} {score 4.812004089355469}]
  [{title Cars} {score 4.197734832763672}]
  [{title Dressed to Kill} {score 3.891493320465088}]
  [{title 27 Dresses} {score 3.891493320465088}]
  [{title Planes, Trains & Automobiles} {score 3.8511905670166016}]
  [{title Car Wash} {score 3.39473032951355}]
  [{title Used Cars} {score 3.39473032951355}]
  [{title Blue Car} {score 3.39473032951355}]
  [{title Cars 2} {score 3.39473032951355}]
  [{title Stealing Cars} {score 3.39473032951355}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms-explicit-query.go`.

- Copy and paste the code example into the `synonyms-explicit-query.go` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```go
  package main

  import (
  	"context"
  	"fmt"
  	"time"

  	"go.mongodb.org/mongo-driver/v2/bson"
  	"go.mongodb.org/mongo-driver/v2/mongo"
  	"go.mongodb.org/mongo-driver/v2/mongo/options"
  )

  // define structure of movies collection
  type MovieCollection struct {
  	title string `bson:"Title,omitempty"`
  }

  func main() {
  	var err error
  	// connect to the Atlas cluster
  	ctx := context.Background()
  	client, err := mongo.Connect(options.Client().ApplyURI("<connection-string>"))
  	if err != nil {
  		panic(err)
  	}
  	defer client.Disconnect(ctx)
  	// set namespace
  	collection := client.Database("sample_mflix").Collection("movies")
  	// define pipeline
  	searchStage := bson.D{{"$search", bson.M{
  		"index": "default",
  		"compound": bson.M{
  			"should": bson.A{
  				bson.M{
  					"text": bson.D{
  						{"path", "title"}, {"query", "boat"}, {"synonyms", "transportSynonyms"},
  					},
  				},
  				bson.M{
  					"text": bson.D{
  						{"path", "title"}, {"query", "hat"}, {"synonyms", "attireSynonyms"},
  					},
  				},
  			},
  		},
  	}}}
  	limitStage := bson.D{{"$limit", 10}}
  	projectStage := bson.D{{"$project", bson.D{{"title", 1}, {"_id", 0}, {"score", bson.D{{"$meta", "searchScore"}}}}}}
  	// specify the amount of time the operation can run on the server
  	opts := options.Aggregate()

  	ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
  	defer cancel()

  	// run pipeline
  	cursor, err := collection.Aggregate(ctx, mongo.Pipeline{searchStage, limitStage, projectStage}, opts)
  	if err != nil {
  		panic(err)
  	}
  	// print results
  	var results []bson.D
  	if err = cursor.All(ctx, &results); err != nil {
  		panic(err)
  	}
  	for _, result := range results {
  		fmt.Println(result)
  	}
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the following command to query your collection:

  ```bash
  go run synonyms-explicit-query.go
  ```

  ```none
  [{title Fedora} {score 5.673145294189453}]
  [{title Vessel} {score 5.373150825500488}]
  [{title Boats} {score 4.589139938354492}]
  [{title And the Ship Sails On} {score 4.3452959060668945}]
  [{title Broken Vessels} {score 4.3452959060668945}]
  [{title Sailing to Paradise} {score 4.3452959060668945}]
  [{title Top Hat} {score 4.066137313842773}]
  [{title A Hatful of Rain} {score 4.066137313842773}]
  [{title Boat People} {score 3.711261749267578}]
  [{title Boat Trip} {score 3.711261749267578}]
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the Java Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB Java driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up your Java project with the MongoDB Java driver.

In your IDE, create a new [Maven](https://maven.apache.org/) or [Gradle](https://gradle.org/) project. Add the Bill of Materials (BOM) for MongoDB JVM artifacts to your project to organize dependency versions. The BOM simplifies dependency management by ensuring that you maintain consistent and compatible versions of dependencies, such as between the Java driver and the core driver library. Use the BOM to avoid version conflicts and simplify upgrades.

Select from the following **Maven** and **Gradle** tabs to view instructions for adding the BOM for each dependency manager:

<Tabs>

<Tab name="Maven">

Add the following code to the `dependencyManagement` list in your `pom.xml` file:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.mongodb</groupId>
            <artifactId>mongodb-driver-bom</artifactId>
            <version>5.5.1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

</Tab>

<Tab name="Gradle">

Add the following code to dependencies list in your `build.gradle` file:

```groovy
dependencies {
    implementation(platform("org.mongodb:mongodb-driver-bom:5.5.1"))
}
```

</Tab>

</Tabs>

To view a list of dependencies that the BOM manages, see the [mongodb-driver-bom dependency listing](https://mvnrepository.com/artifact/org.mongodb/mongodb-driver-bom/5.51) on the Maven Repository website.

After adding the BOM, select from the following **Maven** and **Gradle** tabs to view instructions for adding the MongoDB Java Sync Driver as a dependency in your project:

<Tabs>

<Tab name="Maven">

Add the following code to the `dependencies` array in your Maven project's `pom.xml` file:

```xml
<dependencies>
    <dependency>
      <groupId>org.mongodb</groupId>
      <artifactId>mongodb-driver-sync</artifactId>
      <version>4.11.1</version>
    </dependency>
</dependencies>

```

</Tab>

<Tab name="Gradle">

Add the following to the `dependencies` array in your Gradle project's `build.gradle` file:

```json
dependencies {
   // MongoDB Java Sync Driver v4.11.0 or later
   implementation 'org.mongodb:mongodb-driver-sync'
}

```

</Tab>

</Tabs>

Run your package manager to install the dependencies to your project.

For more detailed installation instructions and version compatibility, see the [MongoDB Java Driver documentation](https://www.mongodb.com/docs/drivers/java/sync/current/get-started/).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```java
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import com.mongodb.client.model.CreateCollectionOptions;

import java.util.Arrays;

public class TransportSynonyms {
    public static void main(String[] args) {
        // Connect to MongoDB
        String connectionString = "<connection-string>";
        try (MongoClient mongoClient = MongoClients.create(connectionString)) {

            // Get the sample_mflix database
            MongoDatabase database = mongoClient.getDatabase("sample_mflix");

            // Create the transport_synonyms collection
            try {
                database.createCollection("transport_synonyms", new CreateCollectionOptions());
            } catch (Exception e) {
                // Collection may already exist, which is fine
                System.out.println("Note: " + e.getMessage());
            }

            // Get the collection
            MongoCollection<Document> collection = database.getCollection("transport_synonyms");

            // Create and insert the first document - equivalent mapping
            Document doc1 = new Document("mappingType", "equivalent")
                    .append("synonyms", Arrays.asList("car", "vehicle", "automobile"));

            collection.insertOne(doc1);

            // Create and insert the second document - explicit mapping
            Document doc2 = new Document("mappingType", "explicit")
                    .append("input", Arrays.asList("boat"))
                    .append("synonyms", Arrays.asList("boat", "vessel", "sail"));

            collection.insertOne(doc2);

            System.out.println("Synonyms collections successfully created and populated.");
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }
}

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```java
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import com.mongodb.client.model.CreateCollectionOptions;

import java.util.Arrays;

public class MultipleSynonyms {
    public static void main(String[] args) {
        // Connect to MongoDB
        String connectionString = "<connection-string>";
        try (MongoClient mongoClient = MongoClients.create(connectionString)) {

            // Get the sample_mflix database
            MongoDatabase database = mongoClient.getDatabase("sample_mflix");

            // Create the transport_synonyms collection
            try {
                database.createCollection("transport_synonyms", new CreateCollectionOptions());
            } catch (Exception e) {
                // Collection may already exist, which is fine
                System.out.println("Note: " + e.getMessage());
            }

            // Get the transport_synonyms collection
            MongoCollection<Document> transportCollection = database.getCollection("transport_synonyms");

            // Create and insert the first transport document - equivalent mapping
            Document doc1 = new Document("mappingType", "equivalent")
                    .append("synonyms", Arrays.asList("car", "vehicle", "automobile"));

            transportCollection.insertOne(doc1);

            // Create and insert the second transport document - explicit mapping
            Document doc2 = new Document("mappingType", "explicit")
                    .append("input", Arrays.asList("boat"))
                    .append("synonyms", Arrays.asList("boat", "vessel", "sail"));

            transportCollection.insertOne(doc2);

            // Create the attire_synonyms collection
            try {
                database.createCollection("attire_synonyms", new CreateCollectionOptions());
            } catch (Exception e) {
                // Collection may already exist, which is fine
                System.out.println("Note: " + e.getMessage());
            }

            // Get the attire_synonyms collection
            MongoCollection<Document> attireCollection = database.getCollection("attire_synonyms");

            // Create and insert the first attire document - equivalent mapping
            Document doc3 = new Document("mappingType", "equivalent")
                    .append("synonyms", Arrays.asList("dress", "apparel", "attire"));

            attireCollection.insertOne(doc3);

            // Create and insert the second attire document - explicit mapping
            Document doc4 = new Document("mappingType", "explicit")
                    .append("input", Arrays.asList("hat"))
                    .append("synonyms", Arrays.asList("hat", "fedora", "headgear"));

            attireCollection.insertOne(doc4);

            System.out.println("Synonyms collections successfully created and populated.");
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            System.exit(1);
        }
    }
}

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Compile and run the file to create the index.

Compile and run your application in your IDE or your shell.

```shell
javac FileName.java
java FileName
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `CreateIndex.java` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```java
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class CreateIndex {
    public static void main(String[] args) {
        // connect to your Atlas cluster
        String uri = "<connection-string>";

        try (MongoClient mongoClient = MongoClients.create(uri)) {
            // set namespace
            MongoDatabase database = mongoClient.getDatabase("sample_mflix");
            MongoCollection<Document> collection = database.getCollection("movies");
            String indexName = "default";

            Document titleField = new Document("analyzer", "lucene.english")
                    .append("type", "string");

            Document synonymSource = new Document("collection", "transport_synonyms");

            Document synonym = new Document("analyzer", "lucene.english")
                    .append("name", "transportSynonyms")
                    .append("source", synonymSource);

            Document index = new Document("mappings",
                    new Document("dynamic", false)
                            .append("fields", new Document("title", titleField)))
                    .append("synonyms", java.util.Arrays.asList(synonym));

            String result = collection.createSearchIndex(indexName, index);
            System.out.println("New index name: " + result);
        }
    }
}
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `CreateIndexMultiple.java` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```java
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

public class CreateIndexMultiple {
    public static void main(String[] args) {
        // connect to your Atlas cluster
        String uri = "<connection-string>";

        try (MongoClient mongoClient = MongoClients.create(uri)) {
            // set namespace
            MongoDatabase database = mongoClient.getDatabase("sample_mflix");
            MongoCollection<Document> collection = database.getCollection("movies");
            String indexName = "default";

            Document titleField = new Document("analyzer", "lucene.english")
                    .append("type", "string");

            Document transportSynonymSource = new Document("collection", "transport_synonyms");
            Document transportSynonym = new Document("analyzer", "lucene.english")
                    .append("name", "transportSynonyms")
                    .append("source", transportSynonymSource);

            Document attireSynonymSource = new Document("collection", "attire_synonyms");
            Document attireSynonym = new Document("analyzer", "lucene.english")
                    .append("name", "attireSynonyms")
                    .append("source", attireSynonymSource);

            Document index = new Document("mappings",
                    new Document("dynamic", false)
                            .append("fields", new Document("title", titleField)))
                    .append("synonyms", java.util.Arrays.asList(transportSynonym, attireSynonym));

            String result = collection.createSearchIndex(indexName, index);
            System.out.println("New index name: " + result);
        }
    }
}
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Compile and run the file to create the index.

Compile and run your application in your IDE or your shell.

```shell
javac FileName.java
java FileName
```

```
New index name: default
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Ensure that your `CLASSPATH` contains the following libraries.

<table>

<tr>
<td>
`junit`

</td>
<td>
4.11 or higher version

</td>
</tr>
<tr>
<td>
`mongodb-driver-sync`

</td>
<td>
4.3.0 or higher version

</td>
</tr>
<tr>
<td>
`slf4j-log4j12`

</td>
<td>
1.7.30 or higher version

</td>
</tr>
</table>

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `SynonymsEquivalentQuery.java`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```java
  import java.util.Arrays;
  import static com.mongodb.client.model.Filters.eq;
  import static com.mongodb.client.model.Aggregates.limit;
  import static com.mongodb.client.model.Aggregates.project;
  import static com.mongodb.client.model.Projections.excludeId;
  import static com.mongodb.client.model.Projections.fields;
  import static com.mongodb.client.model.Projections.include;
  import static com.mongodb.client.model.Projections.computed;
  import com.mongodb.client.MongoClient;
  import com.mongodb.client.MongoClients;
  import com.mongodb.client.MongoCollection;
  import com.mongodb.client.MongoDatabase;
  import org.bson.Document;

  public class SynonymsEquivalentQuery {
    public static void main( String[] args ) {
      // define query
      Document agg = new Document("$search",
          new Document("index", "default")
          .append("text",
              new Document("query", "automobile")
              .append("path","title")
              .append("synonyms", "transportSynonyms")));

      // specify connection
      String uri = "<connection-string>";

      // establish connection and set namespace
      try (MongoClient mongoClient = MongoClients.create(uri)) {
        MongoDatabase database = mongoClient.getDatabase("sample_mflix");
        MongoCollection<Document> collection = database.getCollection("movies");

  			// run query and print results
        collection.aggregate(Arrays.asList(agg,
          limit(10),
          project(fields(excludeId(), include("title"), computed("score", new Document("$meta", "searchScore")))))
        ).forEach(doc -> System.out.println(doc.toJson()));	
      }
    }
  }

  ```

  To run the sample code in your Maven environment, add the following above the import statements in your file.

  ```
  package com.mongodb.drivers;
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Compile and run `SynonymsEquivalentQuery.java` file.

  ```shell
  javac SynonymsEquivalentQuery.java
  java SynonymsEquivalentQuery
  ```

  ```json
  {"title": "Cars", "score": 4.197734832763672}
  {"title": "Planes, Trains & Automobiles", "score": 3.8511905670166016}
  {"title": "Car Wash", "score": 3.39473032951355}
  {"title": "Used Cars", "score": 3.39473032951355}
  {"title": "Blue Car", "score": 3.39473032951355}
  {"title": "Cars 2", "score": 3.39473032951355}
  {"title": "Stealing Cars", "score": 3.39473032951355}
  {"title": "Cop Car", "score": 3.39473032951355}
  {"title": "The Cars That Eat People", "score": 2.8496146202087402}
  {"title": "Khrustalyov, My Car!", "score": 2.8496146202087402}
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `SynonymsExplicitQuery.java`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```java
  import java.util.Arrays;
  import static com.mongodb.client.model.Filters.eq;
  import static com.mongodb.client.model.Aggregates.limit;
  import static com.mongodb.client.model.Aggregates.project;
  import static com.mongodb.client.model.Projections.excludeId;
  import static com.mongodb.client.model.Projections.fields;
  import static com.mongodb.client.model.Projections.include;
  import static com.mongodb.client.model.Projections.computed;
  import com.mongodb.client.MongoClient;
  import com.mongodb.client.MongoClients;
  import com.mongodb.client.MongoCollection;
  import com.mongodb.client.MongoDatabase;
  import org.bson.Document;

  public class SynonymsExplicitQuery {
    public static void main( String[] args ) {
      // define query
      Document agg = new Document("$search",
          new Document("index", "default")
          .append("text",
              new Document("query", "boat")
              .append("path","title")
              .append("synonyms", "transportSynonyms")));

      // specify connection
      String uri = "<connection-string>";

      // establish connection and set namespace
      try (MongoClient mongoClient = MongoClients.create(uri)) {
        MongoDatabase database = mongoClient.getDatabase("sample_mflix");
        MongoCollection<Document> collection = database.getCollection("movies");
  			
        // run query and print results
        collection.aggregate(Arrays.asList(agg,
          limit(10),
          project(fields(excludeId(), include("title"), computed("score", new Document("$meta", "searchScore")))))
        ).forEach(doc -> System.out.println(doc.toJson()));	
      }
    }
  }
  ```

  To run the sample code in your Maven environment, add the following above the import statements in your file.

  ```
  package com.mongodb.drivers;
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Compile and run `SynonymsExplicitQuery.java` file.

  ```shell
  javac SynonymsExplicitQuery.java
  java SynonymsExplicitQuery
  ```

  ```json
  {"title": "Vessel", "score": 5.373150825500488}
  {"title": "Boats", "score": 4.589139938354492}
  {"title": "And the Ship Sails On", "score": 4.3452959060668945}
  {"title": "Broken Vessels", "score": 4.3452959060668945}
  {"title": "Sailing to Paradise", "score": 4.3452959060668945}
  {"title": "Boat People", "score": 3.711261749267578}
  {"title": "Boat Trip", "score": 3.711261749267578}
  {"title": "Three Men in a Boat", "score": 3.1153182983398438}
  {"title": "The Glass Bottom Boat", "score": 3.1153182983398438}
  {"title": "Jack Goes Boating", "score": 3.1153182983398438}
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index with multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `SynonymsEquivalentQuery.java`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```java
  import java.util.Arrays;
  import static com.mongodb.client.model.Filters.eq;
  import static com.mongodb.client.model.Aggregates.limit;
  import static com.mongodb.client.model.Aggregates.project;
  import static com.mongodb.client.model.Projections.computed;
  import static com.mongodb.client.model.Projections.excludeId;
  import static com.mongodb.client.model.Projections.fields;
  import static com.mongodb.client.model.Projections.include;
  import com.mongodb.client.MongoClient;
  import com.mongodb.client.MongoClients;
  import com.mongodb.client.MongoCollection;
  import com.mongodb.client.MongoDatabase;
  import org.bson.Document;

  public class SynonymsEquivalentQuery {
  	public static void main( String[] args ) {
  		Document agg = new Document("$search",
  			new Document("index", "default")
  			.append("compound",
  				new Document("should", Arrays.asList(new Document("text",
                  	new Document("path", "title")
                  	.append("query", "automobile")
                  	.append("synonyms", "transportSynonyms")),
  			new Document("text",
  				new Document("path", "title")
  				.append("query", "attire")
                  .append("synonyms", "attireSynonyms"))))));
  		
  		String uri = "<connection-string>";

  		try (MongoClient mongoClient = MongoClients.create(uri)) {
  			MongoDatabase database = mongoClient.getDatabase("sample_mflix");
  			MongoCollection<Document> collection = database.getCollection("movies");
  					
  			collection.aggregate(Arrays.asList(agg,
  					limit(10),
  					project(fields(excludeId(), include("title"), computed("score", new Document("$meta", "searchScore")))))
  			).forEach(doc -> System.out.println(doc.toJson()));	
  		}
  	}
  }

  ```

  To run the sample code in your Maven environment, add the following above the import statements in your file.

  ```
  package com.mongodb.drivers;
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Compile and run `SynonymsEquivalentQuery.java` file.

  ```shell
  javac SynonymsEquivalentQuery.java
  java SynonymsEquivalentQuery
  ```

  ```json
  {"title": "The Dress", "score": 4.812004089355469}
  {"title": "Cars", "score": 4.197734832763672}
  {"title": "Dressed to Kill", "score": 3.891493320465088}
  {"title": "27 Dresses", "score": 3.891493320465088}
  {"title": "Planes, Trains & Automobiles", "score": 3.8511905670166016}
  {"title": "Car Wash", "score": 3.39473032951355}
  {"title": "Used Cars", "score": 3.39473032951355}
  {"title": "Blue Car", "score": 3.39473032951355}
  {"title": "Cars 2", "score": 3.39473032951355}
  {"title": "Stealing Cars", "score": 3.39473032951355}

  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `SynonymsExplicitQuery.java`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```java
  import java.util.Arrays;
  import static com.mongodb.client.model.Filters.eq;
  import static com.mongodb.client.model.Aggregates.limit;
  import static com.mongodb.client.model.Aggregates.project;
  import static com.mongodb.client.model.Projections.computed;
  import static com.mongodb.client.model.Projections.excludeId;
  import static com.mongodb.client.model.Projections.fields;
  import static com.mongodb.client.model.Projections.include;
  import com.mongodb.client.MongoClient;
  import com.mongodb.client.MongoClients;
  import com.mongodb.client.MongoCollection;
  import com.mongodb.client.MongoDatabase;
  import org.bson.Document;

  public class SynonymsExplicitQuery {
  	public static void main( String[] args ) {
  		Document agg = new Document("$search",
  			new Document("index", "default")
  			.append("compound",
  				new Document("should", Arrays.asList(new Document("text",
  					new Document("path", "title")
  					.append("query", "boat")
  					.append("synonyms", "transportSynonyms")),
  				new Document("text",
  					new Document("path", "title")
  					.append("query", "hat")
  					.append("synonyms", "attireSynonyms"))))));
  		
  		String uri = "<connection-string>";

  		try (MongoClient mongoClient = MongoClients.create(uri)) {
  			MongoDatabase database = mongoClient.getDatabase("sample_mflix");
  			MongoCollection<Document> collection = database.getCollection("movies");
  					
  			collection.aggregate(Arrays.asList(agg,
  					limit(10),
  					project(fields(excludeId(), include("title"), computed("score", new Document("$meta", "searchScore")))))
  			).forEach(doc -> System.out.println(doc.toJson()));	
  		}
  	}
  }

  ```

  To run the sample code in your Maven environment, add the following above the import statements in your file.

  ```
  package com.mongodb.drivers;
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Compile and run `SynonymsExplicitQuery.java` file.

  ```shell
  javac SynonymsExplicitQuery.java
  java SynonymsExplicitQuery
  ```

  ```json
  {"title": "Fedora", "score": 5.673145294189453}
  {"title": "Vessel", "score": 5.373150825500488}
  {"title": "Boats", "score": 4.589139938354492}
  {"title": "And the Ship Sails On", "score": 4.3452959060668945}
  {"title": "Broken Vessels", "score": 4.3452959060668945}
  {"title": "Sailing to Paradise", "score": 4.3452959060668945}
  {"title": "Top Hat", "score": 4.066137313842773}
  {"title": "A Hatful of Rain", "score": 4.066137313842773}
  {"title": "Boat People", "score": 3.711261749267578}
  {"title": "Boat Trip", "score": 3.711261749267578}

  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the Kotlin Coroutine Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB Java driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up your Kotlin project with the MongoDB Kotlin Coroutine driver.

In your IDE, create a new [Maven](https://maven.apache.org/) or [Gradle](https://gradle.org/) project. Add the Bill of Materials (BOM) for MongoDB JVM artifacts to your project to organize dependency versions. The BOM simplifies dependency management by ensuring that you maintain consistent and compatible versions of dependencies, such as between the Java driver and the core driver library. Use the BOM to avoid version conflicts and simplify upgrades.

Select from the following **Maven** and **Gradle** tabs to view instructions for adding the BOM for each dependency manager:

<Tabs>

<Tab name="Maven">

Add the following code to the `dependencyManagement` list in your `pom.xml` file:

```xml
<dependencyManagement>
    <dependencies>
        <dependency>
            <groupId>org.mongodb</groupId>
            <artifactId>mongodb-driver-bom</artifactId>
            <version>5.5.1</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```

</Tab>

<Tab name="Gradle">

Add the following code to the dependencies list in your `build.gradle` file:

```groovy
dependencies {
    implementation(platform("org.mongodb:mongodb-driver-bom:5.5.1"))
}
```

</Tab>

</Tabs>

To view a list of dependencies that the BOM manages, see the [mongodb-driver-bom dependency listing](https://mvnrepository.com/artifact/org.mongodb/mongodb-driver-bom/5.51) on the Maven Repository website.

After adding the BOM, select from the following **Maven** and **Gradle** tabs to view instructions for adding the MongoDB Kotlin Coroutine Driver as a dependency in your project:

<Tabs>

<Tab name="Maven">

Add the following code to the `dependencies` array in your Maven project's `pom.xml` file:

```xml
<dependencies>
    <dependency>
        <groupId>org.mongodb</groupId>
        <artifactId>mongodb-driver-kotlin-coroutine</artifactId>
    </dependency>
</dependencies>
```

</Tab>

<Tab name="Gradle">

Add the following to the `dependencies` array in your Gradle project's `build.gradle` file:

```json
dependencies {
    implementation("org.mongodb:mongodb-driver-kotlin-coroutine")
}
```

</Tab>

</Tabs>

Run your package manager to install the dependencies to your project.

For more detailed installation instructions and version compatibility, see the [MongoDB Kotlin Coroutine Driver documentation](https://www.mongodb.com/docs/drivers/kotlin/coroutine/current/quick-start/).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```kotlin
import com.mongodb.kotlin.client.coroutine.MongoClient
import kotlinx.coroutines.runBlocking
import org.bson.Document

fun main() = runBlocking {
    // Replace the placeholder with your MongoDB deployment's connection string
    val uri = "<connection-string>"

    val mongoClient = MongoClient.create(uri)
    val database = mongoClient.getDatabase("sample_mflix")

    try {
        // Create the transport_synonyms collection
        try {
            database.createCollection("transport_synonyms")
        } catch (e: Exception) {
            // Collection may already exist, which is fine
            println("Note: ${e.message}")
        }

        // Get the collection
        val collection = database.getCollection<Document>("transport_synonyms")

        // Create and insert the first document - equivalent mapping
        val doc1 = Document("mappingType", "equivalent")
            .append("synonyms", listOf("car", "vehicle", "automobile"))

        collection.insertOne(doc1)

        // Create and insert the second document - explicit mapping
        val doc2 = Document("mappingType", "explicit")
            .append("input", listOf("boat"))
            .append("synonyms", listOf("boat", "vessel", "sail"))

        collection.insertOne(doc2)

        println("Synonyms collections successfully created and populated.")
    } catch (e: Exception) {
        System.err.println("Error: ${e.message}")
        System.exit(1)
    } finally {
        mongoClient.close()
    }
}

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```kotlin
import com.mongodb.kotlin.client.coroutine.MongoClient
import kotlinx.coroutines.runBlocking
import org.bson.Document

fun main() = runBlocking {
    // Replace the placeholder with your MongoDB deployment's connection string
    val uri = "<connection-string>"

    val mongoClient = MongoClient.create(uri)
    val database = mongoClient.getDatabase("sample_mflix")

    try {
        // Create the transport_synonyms collection
        try {
            database.createCollection("transport_synonyms")
        } catch (e: Exception) {
            // Collection may already exist, which is fine
            println("Note: ${e.message}")
        }

        // Get the transport_synonyms collection
        val transportCollection = database.getCollection<Document>("transport_synonyms")

        // Create and insert the first transport document - equivalent mapping
        val doc1 = Document("mappingType", "equivalent")
            .append("synonyms", listOf("car", "vehicle", "automobile"))

        transportCollection.insertOne(doc1)

        // Create and insert the second transport document - explicit mapping
        val doc2 = Document("mappingType", "explicit")
            .append("input", listOf("boat"))
            .append("synonyms", listOf("boat", "vessel", "sail"))

        transportCollection.insertOne(doc2)

        // Create the attire_synonyms collection
        try {
            database.createCollection("attire_synonyms")
        } catch (e: Exception) {
            // Collection may already exist, which is fine
            println("Note: ${e.message}")
        }

        // Get the attire_synonyms collection
        val attireCollection = database.getCollection<Document>("attire_synonyms")

        // Create and insert the first attire document - equivalent mapping
        val doc3 = Document("mappingType", "equivalent")
            .append("synonyms", listOf("dress", "apparel", "attire"))

        attireCollection.insertOne(doc3)

        // Create and insert the second attire document - explicit mapping
        val doc4 = Document("mappingType", "explicit")
            .append("input", listOf("hat"))
            .append("synonyms", listOf("hat", "fedora", "headgear"))

        attireCollection.insertOne(doc4)

        println("Synonyms collections successfully created and populated.")
    } catch (e: Exception) {
        System.err.println("Error: ${e.message}")
        System.exit(1)
    } finally {
        mongoClient.close()
    }
}

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Compile and run the file to create the index.

Compile and run your application in your IDE or your shell.

```shell
kotlinc FileName.kt -include-runtime -d FileName.jar
java -jar FileName.jar
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `CreateIndex.kt` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```kotlin
import com.mongodb.kotlin.client.coroutine.MongoClient
import kotlinx.coroutines.runBlocking
import org.bson.Document

fun main() = runBlocking {
    // connect to your Atlas cluster
    val uri = "<connection-string>"

    val mongoClient = MongoClient.create(uri)
    try {
        // set namespace
        val database = mongoClient.getDatabase("sample_mflix")
        val collection = database.getCollection<Document>("movies")
        val indexName = "default"

        val titleField = Document("analyzer", "lucene.english")
            .append("type", "string")

        val synonymSource = Document("collection", "transport_synonyms")

        val synonym = Document("analyzer", "lucene.english")
            .append("name", "transportSynonyms")
            .append("source", synonymSource)

        val index = Document("mappings",
            Document("dynamic", false)
                .append("fields", Document("title", titleField)))
            .append("synonyms", listOf(synonym))

        val result = collection.createSearchIndex(indexName, index)
        println("New index name: $result")
    } finally {
        mongoClient.close()
    }
}
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `CreateIndexMultiple.kt` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```kotlin
import com.mongodb.kotlin.client.coroutine.MongoClient
import kotlinx.coroutines.runBlocking
import org.bson.Document

fun main() = runBlocking {
    // connect to your Atlas cluster
    val uri = "<connection-string>"

    val mongoClient = MongoClient.create(uri)
    try {
        // set namespace
        val database = mongoClient.getDatabase("sample_mflix")
        val collection = database.getCollection<Document>("movies")
        val indexName = "default"

        val titleField = Document("analyzer", "lucene.english")
            .append("type", "string")

        val transportSynonymSource = Document("collection", "transport_synonyms")
        val transportSynonym = Document("analyzer", "lucene.english")
            .append("name", "transportSynonyms")
            .append("source", transportSynonymSource)

        val attireSynonymSource = Document("collection", "attire_synonyms")
        val attireSynonym = Document("analyzer", "lucene.english")
            .append("name", "attireSynonyms")
            .append("source", attireSynonymSource)

        val index = Document("mappings",
            Document("dynamic", false)
                .append("fields", Document("title", titleField)))
            .append("synonyms", listOf(transportSynonym, attireSynonym))

        val result = collection.createSearchIndex(indexName, index)
        println("New index name: $result")
    } finally {
        mongoClient.close()
    }
}
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Compile and run the file to create the index.

Compile and run your application in your IDE or your shell.

```shell
kotlinc FileName.kt -include-runtime -d FileName.jar
java -jar FileName.jar
```

```
New index name: default
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Ensure that you add the following dependency to your project.

<table>

<tr>
<td>
`mongodb-driver-kotlin-coroutine`

</td>
<td>
4.10.0 or higher version

</td>
</tr>
</table>

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Prints the documents that match the query from the `AggregateFlow` instance.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `SynonymsEquivalentQuery.kt`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```kotlin
  import com.mongodb.client.model.Aggregates.limit
  import com.mongodb.client.model.Aggregates.project
  import com.mongodb.client.model.Projections.*
  import com.mongodb.kotlin.client.coroutine.MongoClient
  import kotlinx.coroutines.runBlocking
  import org.bson.Document

  fun main() {
      // establish connection and set namespace
      val uri = "<connection-string>"
      val mongoClient = MongoClient.create(uri)
      val database = mongoClient.getDatabase("sample_mflix")
      val collection = database.getCollection<Document>("movies")

      runBlocking {
          // define query
          val agg = Document(
              "\$search",
              Document("index", "default")
                  .append(
                      "text",
                      Document("query", "automobile")
                          .append("path", "title")
                          .append("synonyms", "transportSynonyms")
                  )
          )

          // run query and print results
          val resultsFlow = collection.aggregate<Document>(
              listOf(
                  agg,
                  limit(10),
                  project(fields(
                      excludeId(),
                      include("title"),
                      computed("score", Document("\$meta", "searchScore"))
                  ))
              )
          )
          resultsFlow.collect { println(it) }
      }
      mongoClient.close()
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the `SynonymsEquivalentQuery.kt` file.

  When you run the `SynonymsEquivalentQuery.kt` program in your IDE, it prints the following documents:

  ```none
  Document{{title=Cars, score=4.140600204467773}}
  Document{{title=Planes, Trains & Automobiles, score=3.8122920989990234}}
  Document{{title=Blue Car, score=3.348478317260742}}
  Document{{title=Used Cars, score=3.348478317260742}}
  Document{{title=Cars 2, score=3.348478317260742}}
  Document{{title=Stealing Cars, score=3.348478317260742}}
  Document{{title=Cop Car, score=3.348478317260742}}
  Document{{title=Car Wash, score=3.348478317260742}}
  Document{{title=The Cars That Eat People, score=2.810762405395508}}
  Document{{title=Revenge of the Electric Car, score=2.810762405395508}}
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `SynonymsExplicitQuery.kt`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```kotlin
  import com.mongodb.client.model.Aggregates.limit
  import com.mongodb.client.model.Aggregates.project
  import com.mongodb.client.model.Projections.*
  import com.mongodb.kotlin.client.coroutine.MongoClient
  import kotlinx.coroutines.runBlocking
  import org.bson.Document

  fun main() {
      // establish connection and set namespace
      val uri = "<connection-string>"
      val mongoClient = MongoClient.create(uri)
      val database = mongoClient.getDatabase("sample_mflix")
      val collection = database.getCollection<Document>("movies")

      runBlocking {
          // define query
          val agg = Document(
              "\$search",
              Document("index", "default")
                  .append(
                      "text",
                      Document("query", "boat")
                          .append("path", "title")
                          .append("synonyms", "transportSynonyms")
                  )
          )

          // run query and print results
          val resultsFlow = collection.aggregate<Document>(
              listOf(
                  agg,
                  limit(10),
                  project(fields(
                      excludeId(),
                      include("title"),
                      computed("score", Document("\$meta", "searchScore"))
                  ))
              )
          )
          resultsFlow.collect { println(it) }
      }
      mongoClient.close()
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the `SynonymsExplicitQuery.kt` file.

  When you run the `SynonymsExplicitQuery.kt` program in your IDE, it prints the following documents:

  ```none
  Document{{title=Vessel, score=5.3159894943237305}}
  Document{{title=Boats, score=4.597315311431885}}
  Document{{title=Sailing to Paradise, score=4.299008369445801}}
  Document{{title=And the Ship Sails On, score=4.299008369445801}}
  Document{{title=Broken Vessels, score=4.299008369445801}}
  Document{{title=Boat Trip, score=3.717820644378662}}
  Document{{title=Boat People, score=3.717820644378662}}
  Document{{title=Jack Goes Boating, score=3.1207938194274902}}
  Document{{title=The Glass Bottom Boat, score=3.1207938194274902}}
  Document{{title=Raspberry Boat Refugee, score=3.1207938194274902}}
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index with multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb` packages and dependencies.

- Establishes a connection to your cluster.

- Prints the documents that match the query from the `AggregateFlow` instance.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `SynonymsEquivalentQuery.kt`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```kotlin
  import com.mongodb.client.model.Aggregates.limit
  import com.mongodb.client.model.Aggregates.project
  import com.mongodb.client.model.Projections.*
  import com.mongodb.kotlin.client.coroutine.MongoClient
  import kotlinx.coroutines.runBlocking
  import org.bson.Document

  fun main() {
      // establish connection and set namespace
      val uri = "<connection-string>"
      val mongoClient = MongoClient.create(uri)
      val database = mongoClient.getDatabase("sample_mflix")
      val collection = database.getCollection<Document>("movies")

      runBlocking {
          // define query
          val agg = Document(
              "\$search",
              Document("index", "default")
                  .append(
                      "compound",
                      Document(
                          "should", listOf(
                              Document(
                                  "text",
                                  Document("path", "title")
                                      .append("query", "automobile")
                                      .append("synonyms", "transportSynonyms")
                              ),
                              Document(
                                  "text",
                                  Document("path", "title")
                                      .append("query", "attire")
                                      .append("synonyms", "attireSynonyms")
                              )
                          )
                      )
                  )
          )

          // run query and print results
          val resultsFlow = collection.aggregate<Document>(
              listOf(
                  agg,
                  limit(10),
                  project(fields(
                      excludeId(),
                      include("title"),
                      computed("score", Document("\$meta", "searchScore"))
                  ))
              )
          )
          resultsFlow.collect { println(it) }
      }
      mongoClient.close()
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the `SynonymsEquivalentQuery.kt` file.

  When you run the `SynonymsEquivalentQuery.kt` program in your IDE, it prints the following documents:

  ```none
  Document{{title=The Dress, score=4.852960586547852}}
  Document{{title=Cars, score=4.140600204467773}}
  Document{{title=27 Dresses, score=3.9245595932006836}}
  Document{{title=Planes, Trains & Automobiles, score=3.8122920989990234}}
  Document{{title=Car Wash, score=3.348478317260742}}
  Document{{title=Used Cars, score=3.348478317260742}}
  Document{{title=Blue Car, score=3.348478317260742}}
  Document{{title=Cars 2, score=3.348478317260742}}
  Document{{title=Stealing Cars, score=3.348478317260742}}
  Document{{title=Cop Car, score=3.348478317260742}}
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `SynonymsExplicitQuery.kt`.

- Copy and paste the following code into the file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```kotlin
  import com.mongodb.client.model.Aggregates.limit
  import com.mongodb.client.model.Aggregates.project
  import com.mongodb.client.model.Projections.*
  import com.mongodb.kotlin.client.coroutine.MongoClient
  import kotlinx.coroutines.runBlocking
  import org.bson.Document

  fun main() {
      // establish connection and set namespace
      val uri = "<connection-string>"
      val mongoClient = MongoClient.create(uri)
      val database = mongoClient.getDatabase("sample_mflix")
      val collection = database.getCollection<Document>("movies")

      runBlocking {
          // define query
          val agg = Document(
              "\$search",
              Document("index", "default")
                  .append(
                      "compound",
                      Document(
                          "should", listOf(
                              Document(
                                  "text",
                                  Document("path", "title")
                                      .append("query", "boat")
                                      .append("synonyms", "transportSynonyms")
                              ),
                              Document(
                                  "text",
                                  Document("path", "title")
                                      .append("query", "hat")
                                      .append("synonyms", "attireSynonyms")
                              )
                          )
                      )
                  )
          )

          // run query and print results
          val resultsFlow = collection.aggregate<Document>(
              listOf(
                  agg,
                  limit(10),
                  project(fields(
                      excludeId(),
                      include("title"),
                      computed("score", Document("\$meta", "searchScore"))
                  ))
              )
          )

          resultsFlow.collect { println(it) }
      }

      mongoClient.close()
  }

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials. To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

- Run the `SynonymsExplicitQuery.kt` file.

  When you run the `SynonymsExplicitQuery.kt` program in your IDE, it prints the following documents:

  ```none
  Document{{title=Fedora, score=5.6159772872924805}}
  Document{{title=Vessel, score=5.3159894943237305}}
  Document{{title=Boats, score=4.597315311431885}}
  Document{{title=And the Ship Sails On, score=4.299008369445801}}
  Document{{title=Broken Vessels, score=4.299008369445801}}
  Document{{title=Sailing to Paradise, score=4.299008369445801}}
  Document{{title=Top Hat, score=4.01986026763916}}
  Document{{title=A Hatful of Rain, score=4.01986026763916}}
  Document{{title=Boat People, score=3.717820644378662}}
  Document{{title=Boat Trip, score=3.717820644378662}}
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the Node.js Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB Node.js driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Initialize your Node.js project.

```shell
# Create a new directory and initialize the project
mkdir atlas-search-project && cd atlas-search-project
npm init -y

# Add the MongoDB Node.js Driver to your project
npm install mongodb
```

For detailed installation instructions, see the [MongoDB Node Driver documentation](https://www.mongodb.com/docs/drivers/node/current/).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```javascript
const { MongoClient } = require('mongodb');

async function createTransportSynonyms() {
  // Connection URI
  const uri = '<connection-string>';

  // Create a new MongoClient
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB server
    await client.connect();

    // Get the sample_mflix database
    const database = client.db('sample_mflix');

    // Create the transport_synonyms collection
    try {
      await database.createCollection('transport_synonyms');
    } catch (err) {
      // Collection may already exist, which is fine
      console.log(`Note: ${err.message}`);
    }

    // Get the collection
    const collection = database.collection('transport_synonyms');

    // Create and insert the first document - equivalent mapping
    const doc1 = {
      mappingType: 'equivalent',
      synonyms: ['car', 'vehicle', 'automobile']
    };

    await collection.insertOne(doc1);

    // Create and insert the second document - explicit mapping
    const doc2 = {
      mappingType: 'explicit',
      input: ['boat'],
      synonyms: ['boat', 'vessel', 'sail']
    };

    await collection.insertOne(doc2);
    console.log('Synonyms collections successfully created and populated.');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    // Close the connection
    await client.close();
  }
}

// Run the function and handle any errors
createTransportSynonyms().catch(console.error);

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```javascript
const { MongoClient } = require('mongodb');

async function createMultipleSynonyms() {
  // Connection URI
  const uri = '<connection-string>';

  // Create a new MongoClient
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB server
    await client.connect();

    // Get the sample_mflix database
    const database = client.db('sample_mflix');

    // Create the transport_synonyms collection
    try {
      await database.createCollection('transport_synonyms');
    } catch (err) {
      // Collection may already exist, which is fine
      console.log(`Note: ${err.message}`);
    }

    // Get the transport_synonyms collection
    const transportCollection = database.collection('transport_synonyms');

    // Create and insert the first transport document - equivalent mapping
    const doc1 = {
      mappingType: 'equivalent',
      synonyms: ['car', 'vehicle', 'automobile']
    };

    await transportCollection.insertOne(doc1);

    // Create and insert the second transport document - explicit mapping
    const doc2 = {
      mappingType: 'explicit',
      input: ['boat'],
      synonyms: ['boat', 'vessel', 'sail']
    };

    await transportCollection.insertOne(doc2);

    // Create the attire_synonyms collection
    try {
      await database.createCollection('attire_synonyms');
    } catch (err) {
      // Collection may already exist, which is fine
      console.log(`Note: ${err.message}`);
    }

    // Get the attire_synonyms collection
    const attireCollection = database.collection('attire_synonyms');

    // Create and insert the first attire document - equivalent mapping
    const doc3 = {
      mappingType: 'equivalent',
      synonyms: ['dress', 'apparel', 'attire']
    };

    await attireCollection.insertOne(doc3);

    // Create and insert the second attire document - explicit mapping
    const doc4 = {
      mappingType: 'explicit',
      input: ['hat'],
      synonyms: ['hat', 'fedora', 'headgear']
    };

    await attireCollection.insertOne(doc4);

    console.log('Synonyms collections successfully created and populated.');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  } finally {
    // Close the connection
    await client.close();
  }
}

// Run the function and handle any errors
createMultipleSynonyms().catch(console.error);

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
node file-name.js
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `create-index.js` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```javascript
const { MongoClient } = require("mongodb");

// connect to your Atlas deployment
const uri =  "<connection-string>";

const client = new MongoClient(uri);

async function run() {
  try {

    // set namespace
    const database = client.db("sample_mflix");
    const collection = database.collection("movies");

    // define your MongoDB Search index
    const index = {
        name: "default",
        definition: {
            "mappings": {
                "dynamic": false,
                "fields": {
                    "title": {
                        "analyzer": "lucene.english",
                        "type": "string"
                    }
                }
            },
            "synonyms": [
                {
                    "analyzer": "lucene.english",
                    "name": "transportSynonyms",
                    "source": {
                        "collection": "transport_synonyms"
                    }
                }
            ]
        }
    }

    // run the helper method
    const result = await collection.createSearchIndex(index);
    console.log("New index name: " + result);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `create-index-multiple.js` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```javascript
const { MongoClient } = require("mongodb");

// connect to your Atlas deployment
const uri =  "<connection-string>";

const client = new MongoClient(uri);

async function run() {
  try {

    // set namespace
    const database = client.db("sample_mflix");
    const collection = database.collection("movies");

    // define your MongoDB Search index
    const index = {
        name: "default",
        definition: {
            "mappings": {
                "dynamic": false,
                "fields": {
                    "title": {
                        "analyzer": "lucene.english",
                        "type": "string"
                    }
                }
            },
            "synonyms": [
                {
                    "analyzer": "lucene.english",
                    "name": "transportSynonyms",
                    "source": {
                        "collection": "transport_synonyms"
                    }
                },
                {
                    "analyzer": "lucene.english",
                    "name": "attireSynonyms",
                    "source": {
                        "collection": "attire_synonyms"
                    }
                }
            ]
        }
    }

    // run the helper method
    const result = await collection.createSearchIndex(index);
    console.log("New index name: " + result);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
node file-name.js
```

```
New index name: default
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `mongodb`, MongoDB's Node.js driver.

- Creates an instance of the `MongoClient` class to establish a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms-equivalent-query.js`.

- Copy and paste the code example into the `synonyms-equivalent-query.js` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```javascript
  const MongoClient = require("mongodb").MongoClient;
  const assert = require("assert");

  const agg = [
    {
      $search: {
        index: "default",
        text: {
          path: "title",
          query: "automobile",
          synonyms: "transportSynonyms",
        },
      },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        _id: 0,
        title: 1,
        score: { $meta: "searchScore" },
      },
    },
  ];

  // Connection URI
  const uri = "<connection-string>";

  MongoClient.connect(uri)
    .then((client) => {
      const coll = client.db("sample_mflix").collection("movies");
      return coll
        .aggregate(agg)
        .toArray()
        .then((results) => {
          console.log(results);
          client.close();
          process.exit(0);
        });
    })
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  node synonyms-equivalent-query.js
  ```

  ```javascript
  { title: 'Cars', score: 4.197734832763672 }
  { title: 'Planes, Trains & Automobiles', score: 3.8511905670166016 }
  { title: 'Car Wash', score: 3.39473032951355 }
  { title: 'Used Cars', score: 3.39473032951355 }
  { title: 'Blue Car', score: 3.39473032951355 }
  { title: 'Cars 2', score: 3.39473032951355 }
  { title: 'Stealing Cars', score: 3.39473032951355 }
  { title: 'Cop Car', score: 3.39473032951355 }
  { title: 'The Cars That Eat People', score: 2.8496146202087402 }
  { title: 'Khrustalyov, My Car!', score: 2.8496146202087402 }
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms-explicit-query.js`.

- Copy and paste the code example into the `synonyms-explicit-query.js` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```javascript
  const MongoClient = require("mongodb").MongoClient;
  const assert = require("assert");

  const agg = [
    {
      $search: {
        index: "default",
        text: {
          path: "title",
          query: "boat",
          synonyms: "transportSynonyms",
        },
      },
    },
    {
      $limit: 10,
    },
    {
      $project: {
        _id: 0,
        title: 1,
        score: { $meta: "searchScore" },
      },
    },
  ];

  // Connection URI
  const uri = "<connection-string>";

  MongoClient.connect(uri)
    .then((client) => {
      const coll = client.db("sample_mflix").collection("movies");
      return coll
        .aggregate(agg)
        .toArray()
        .then((results) => {
          console.log(results);
          client.close();
          process.exit(0);
        });
    })
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });
  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  node synonyms-explicit-query.js
  ```

  ```javascript
  { title: 'Vessel', score: 5.373150825500488 }
  { title: 'Boats', score: 4.589139938354492 }
  { title: 'And the Ship Sails On', score: 4.3452959060668945 }
  { title: 'Broken Vessels', score: 4.3452959060668945 }
  { title: 'Sailing to Paradise', score: 4.3452959060668945 }
  { title: 'Boat People', score: 3.711261749267578 }
  { title: 'Boat Trip', score: 3.711261749267578 }
  { title: 'Three Men in a Boat', score: 3.1153182983398438 }
  { title: 'The Glass Bottom Boat', score: 3.1153182983398438 }
  { title: 'Jack Goes Boating', score: 3.1153182983398438 }
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index with multiple synonym mappings.

These code examples perform the following tasks:

- Imports `mongodb`, MongoDB's Node.js driver.

- Creates an instance of the `MongoClient` class to establish a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms-equivalent-query.js`.

- Copy and paste the code example into the `synonyms-equivalent-query.js` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```javascript
  const MongoClient = require("mongodb").MongoClient;
  const assert = require("assert");

  const agg = [
    {
      $search: {
        index: "default",
        compound: {
          should: [
            {
              text: {
                path: "title",
                query: "automobile",
                synonyms: "transportSynonyms"
              }
            },
            {
              text: {
                path: "title",
                query: "attire",
                synonyms: "attireSynonyms"
              }
            }
          ]
        }
      }
    },
    {
      $limit: 10
    },
    {
      $project: {
        _id: 0,
        title: 1,
        score: {
          $meta: "searchScore"
        }
      }
    }
  ];

  // Connection URI
  const uri = "<connection-string>";

  MongoClient.connect(uri)
    .then((client) => {
      const coll = client.db("sample_mflix").collection("movies");
      return coll
        .aggregate(agg)
        .toArray()
        .then((results) => {
          console.log(results);
          client.close();
          process.exit(0);
        });
    })
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  node synonyms-equivalent-query.js
  ```

  ```javascript
  { title: 'The Dress', score: 4.812004089355469 }
  { title: 'Cars', score: 4.197734832763672 }
  { title: 'Dressed to Kill', score: 3.891493320465088 }
  { title: '27 Dresses', score: 3.891493320465088 }
  { title: 'Planes, Trains & Automobiles', score: 3.8511905670166016 }
  { title: 'Car Wash', score: 3.39473032951355 }
  { title: 'Used Cars', score: 3.39473032951355 }
  { title: 'Blue Car', score: 3.39473032951355 }
  { title: 'Cars 2', score: 3.39473032951355 }
  { title: 'Stealing Cars', score: 3.39473032951355 }

  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms-explicit-query.js`.

- Copy and paste the code example into the `synonyms-explicit-query.js` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```javascript
  const MongoClient = require("mongodb").MongoClient;
  const assert = require("assert");

  const agg = [
    {
      $search: {
        index: "default",
        compound: {
          should: [
            {
              text: {
                path: "title",
                query: "boat",
                synonyms: "transportSynonyms"
              }
            },
            {
              text: {
                path: "title",
                query: "hat",
                synonyms: "attireSynonyms"
              }
            }
          ]
        }
      }
    },
    {
      $limit: 10
    },
    {
      $project: {
        _id: 0,
        title: 1,
        score: {
          $meta: "searchScore"
        }
      }
    }
  ];

  // Connection URI
  const uri = "<connection-string>";

  MongoClient.connect(uri)
    .then((client) => {
      const coll = client.db("sample_mflix").collection("movies");
      return coll
        .aggregate(agg)
        .toArray()
        .then((results) => {
          console.log(results);
          client.close();
          process.exit(0);
        });
    })
    .catch((err) => {
      console.error("Error:", err);
      process.exit(1);
    });

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  node synonyms-explicit-query.js
  ```

  ```javascript
  { title: 'Fedora', score: 5.673145294189453 }
  { title: 'Vessel', score: 5.373150825500488 }
  { title: 'Boats', score: 4.589139938354492 }
  { title: 'And the Ship Sails On', score: 4.3452959060668945 }
  { title: 'Broken Vessels', score: 4.3452959060668945 }
  { title: 'Sailing to Paradise', score: 4.3452959060668945 }
  { title: 'Top Hat', score: 4.066137313842773 }
  { title: 'A Hatful of Rain', score: 4.066137313842773 }
  { title: 'Boat People', score: 3.711261749267578 }
  { title: 'Boat Trip', score: 3.711261749267578 }

  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

This tutorial describes how to add a collection that configures words as synonyms, create an index that defines synonym mappings on the  `sample_mflix.movies` collection, and run MongoDB Search queries against the `title` field using words that are configured as synonyms.

The tutorial takes you through the following steps:

1. Load one or more sample synonyms source collections in the `sample_mflix` database.

2. Create a MongoDB Search index with one or more synonym mappings for the `sample_mflix.movies` collection.

3. Run MongoDB Search queries against the `title` field in the `sample_mflix.movies` collection for words configured as synonyms in the synonyms source collection.

Before you begin, ensure that your cluster meets the requirements described in the [Prerequisites](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/accuracy/#std-label-fts-accuracy-tutorials-prereqs).

To create multiple synonym mappings and run the advanced sample query in this tutorial, you need an `M10` or higher cluster.

## Load the Sample Synonyms Source Collection with the Python Driver

Each document in the synonyms source collection describe how one or more words map to one or more synonyms of those words. To learn more about the fields and word mapping types in the synonyms source collection documents, see [Format of Synonyms Source Collection Documents](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/synonyms/#std-label-synonyms-coll-format).

To begin, you create the synonyms source collection and then add the collection to the database where you intend to use the synonyms source collection. In this section, you create one or two sample synonyms source collections in the `sample_mflix` database using the MongoDB Python driver, and then use the synonyms source collections with an index of the `movies` collection in the same database.

### Set up the Python project.

```shell
# Create a new directory for the project
mkdir atlas-search-project && cd atlas-search-project

# Install PyMongo
pip install pymongo
```

For detailed installation instructions, see [MongoDB Python Driver (PyMongo)](https://www.mongodb.com/docs/languages/python/pymongo-driver/get-started/#std-label-pymongo-get-started-download-and-install).

### Create and populate the synonyms source collections.

If you are running a free tier cluster or a Flex cluster, follow the steps in the Transportation Synonyms tab to create the collection for a single synonym mapping definition in your index. If you have a `M10` or higher cluster and wish to create multiple synonym mappings in your index, follow the steps in the Multiple Synonyms tab to create both the Transportation Synonyms and Attire Synonyms collections.

<Tabs>

<Tab name="Transport Synonyms">

Create and populate the `transport_synonyms` collection:

```python
from pymongo import MongoClient
import sys

def main():
    try:
        # Connect to MongoDB
        client = MongoClient("<connection-string>")

        # Get the sample_mflix database
        database = client["sample_mflix"]

        # Create the transport_synonyms collection
        try:
            database.create_collection("transport_synonyms")
        except Exception as e:
            # Collection may already exist, which is fine
            print(f"Note: {str(e)}")

        # Get the collection
        collection = database["transport_synonyms"]

        # Create and insert the first document - equivalent mapping
        doc1 = {
            "mappingType": "equivalent",
            "synonyms": ["car", "vehicle", "automobile"]
        }

        collection.insert_one(doc1)

        # Create and insert the second document - explicit mapping
        doc2 = {
            "mappingType": "explicit",
            "input": ["boat"],
            "synonyms": ["boat", "vessel", "sail"]
        }

        collection.insert_one(doc2)

        print("Synonyms collections successfully created and populated.")

    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
    finally:
        # Close the connection
        client.close()

if __name__ == "__main__":
    main()

```

</Tab>

<Tab name="Multiple Synonyms">

Create and populate both the `transport_synonyms` and `attire_synonyms` collections:

```python
from pymongo import MongoClient
import sys

def main():
    try:
        # Connect to MongoDB
        client = MongoClient("<connection-string>")

        # Get the sample_mflix database
        database = client["sample_mflix"]

        # Create the transport_synonyms collection
        try:
            database.create_collection("transport_synonyms")
        except Exception as e:
            # Collection may already exist, which is fine
            print(f"Note: {str(e)}")

        # Get the transport_synonyms collection
        transport_collection = database["transport_synonyms"]

        # Create and insert the first transport document - equivalent mapping
        doc1 = {
            "mappingType": "equivalent",
            "synonyms": ["car", "vehicle", "automobile"]
        }

        transport_collection.insert_one(doc1)

        # Create and insert the second transport document - explicit mapping
        doc2 = {
            "mappingType": "explicit",
            "input": ["boat"],
            "synonyms": ["boat", "vessel", "sail"]
        }

        transport_collection.insert_one(doc2)

        # Create the attire_synonyms collection
        try:
            database.create_collection("attire_synonyms")
        except Exception as e:
            # Collection may already exist, which is fine
            print(f"Note: {str(e)}")

        # Get the attire_synonyms collection
        attire_collection = database["attire_synonyms"]

        # Create and insert the first attire document - equivalent mapping
        doc3 = {
            "mappingType": "equivalent",
            "synonyms": ["dress", "apparel", "attire"]
        }

        attire_collection.insert_one(doc3)

        # Create and insert the second attire document - explicit mapping
        doc4 = {
            "mappingType": "explicit",
            "input": ["hat"],
            "synonyms": ["hat", "fedora", "headgear"]
        }

        attire_collection.insert_one(doc4)

        print("Synonyms collections successfully created and populated.")

    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
    finally:
        # Close the connection
        client.close()

if __name__ == "__main__":
    main()

```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
python file_name.py
```

```
Synonyms collections successfully created and populated.
```

## Create the MongoDB Search Index

### Define the index.

To run the simple example query only, use the index definition in the **Single Synonym Mapping** tab below. If you have an `M10` or higher cluster and if you loaded both the example synonyms source collections, you can run both the simple and advanced example queries using the index definition that specifies multiple synonym mappings in the **Multiple Synonym Mappings** tab below.

<Tabs>

<Tab name="Single Synonym Mapping">

Create a `create_index.py` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- The name `transportSynonyms` as the name for this synonym mapping.

- The `transport_synonyms` collection as the source synonyms collection to look for synonyms for queries using `transportSynonyms` mapping. `transportSynonyms` can be used in text queries over any field indexed with the `lucene.english` analyzer (including the `title` field, in this example).

```python
from pymongo import MongoClient
from pymongo.operations import SearchIndexModel

# connect to your Atlas deployment
uri = "<connection-string>"
client = MongoClient(uri)

# set namespace
database = client["sample_mflix"]
collection = database["movies"]

# define your MongoDB Search index
search_index_model = SearchIndexModel(
    definition={
        "mappings": {
            "dynamic": False,
            "fields": {
                "title": {
                   "analyzer": "lucene.english",
                   "type": "string"
                }
            }
        },
        "synonyms": [
            {
                "analyzer": "lucene.english",
                "name": "transportSynonyms",
                "source": {
                    "collection": "transport_synonyms"
                }
            }
        ]
    },
    name="default",
)

# create the index
result = collection.create_search_index(model=search_index_model)
print(f"New index name: {result}")
```

</Tab>

<Tab name="Multiple Synonym Mappings">

Create a `create_index_multiple.py` file in your project directory, and copy and paste the following code into the file.

The following index definition specifies:

- The [language analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)
  `lucene.english` as the default analyzer for both indexing and querying the `title` field.

- Two synonym mappings: `transportSynonyms` and `attireSynonyms`.

- The `transport_synonyms` collection as the source for the `transportSynonyms` mapping.

- The `attire_synonyms` collection as the source for the `attireSynonyms` mapping.

```python
from pymongo import MongoClient
from pymongo.operations import SearchIndexModel

# connect to your Atlas deployment
uri = "<connection-string>"
client = MongoClient(uri)

# set namespace
database = client["sample_mflix"]
collection = database["movies"]

# define your MongoDB Search index
search_index_model = SearchIndexModel(
    definition={
        "mappings": {
            "dynamic": False,
            "fields": {
                "title": {
                   "analyzer": "lucene.english",
                   "type": "string"
                }
            }
        },
        "synonyms": [
            {
                "analyzer": "lucene.english",
                "name": "transportSynonyms",
                "source": {
                    "collection": "transport_synonyms"
                }
            },
            {
                "analyzer": "lucene.english",
                "name": "attireSynonyms",
                "source": {
                    "collection": "attire_synonyms"
                }
            }
        ]
    },
    name="default",
)

# create the index
result = collection.create_search_index(model=search_index_model)
print(f"New index name: {result}")
```

</Tab>

</Tabs>

Replace `<connection-string>` with the connection string for your Atlas cluster or local Atlas deployment.

<Tabs>

<Tab name="Atlas Cluster">

Your connection string should use the following format:

```
mongodb+srv://<db_username>:<db_password>@<clusterName>.<hostname>.mongodb.net
```

To learn more, see [Connect to a Cluster via Client Libraries](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/driver-connection/#std-label-connect-via-driver).

</Tab>

<Tab name="Local or Self-Managed">

Your connection string should use the following format:

```
mongodb://localhost:<port-number>/?directConnection=true
```

To learn more, see [Connection Strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

</Tab>

</Tabs>

### Create the index.

```shell
python file_name.py
```

```
New index name: default
```

## Search the Collection

Synonyms can be used only in queries that use the [text](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/operators-collectors/text/#std-label-text-ref) operator. In this section, you connect to your cluster and then run the sample queries using the `text` operator against the `title` field in the `sample_mflix.movies` collection. The sample queries use words that are configured as synonyms of different mapping types in the synonyms source collection. The source collection is referenced in the synonyms mapping that the queries use.

## Run simple MongoDB Search queries on the `movies` collection.

These code examples perform the following tasks:

- Imports `pymongo`, MongoDB's Python driver, and the `dns` module, which is required to connect `pymongo` to `Atlas` using a DNS (Domain Name System) seed list connection string.

- Creates an instance of the `MongoClient` class to establish a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms-equivalent-query.py`.

- Copy and paste the code example into the `synonyms-equivalent.py` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`

  ```python
  import pymongo
  import dns

  client = pymongo.MongoClient('<connection-string>')
  result = client['sample_mflix']['movies'].aggregate([
    {
      '$search': {
        'index': 'default',
        'text': {
          'path': 'title',
          'query': 'automobile',
          'synonyms': 'transportSynonyms'
        }
      }
    },
    {
      '$limit': 10
    },
    {
      '$project': {
        '_id': 0,
        'title': 1,
        'score': {
          '$meta': 'searchScore'
        }
      }
    }
  ])

  for i in result:
      print(i)

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  python synonyms-equivalent-query.py
  ```

  ```python
  {'title': 'Cars', 'score': 4.197734832763672}
  {'title': 'Planes, Trains & Automobiles', 'score': 3.8511905670166016}
  {'title': 'Car Wash', 'score': 3.39473032951355}
  {'title': 'Used Cars', 'score': 3.39473032951355}
  {'title': 'Blue Car', 'score': 3.39473032951355}
  {'title': 'Cars 2', 'score': 3.39473032951355}
  {'title': 'Stealing Cars', 'score': 3.39473032951355}
  {'title': 'Cop Car', 'score': 3.39473032951355}
  {'title': 'The Cars That Eat People', 'score': 2.8496146202087402}
  {'title': 'Khrustalyov, My Car!', 'score': 2.8496146202087402}
  ```

  The MongoDB Search results contain movies with `car` and `automobile` in the `title` field although the query term is `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection. MongoDB Search returns the same results for a search of the words `car` and `vehicle`. To test this, replace the value of the `query` field in the query above with either `car` or `vehicle` and run the query.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms-explicit-query.py`.

- Copy and paste the code example into the `synonyms-explicit.py` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```python
  import pymongo
  import dns

  client = pymongo.MongoClient('<connection-string>')
  result = client['sample_mflix']['movies'].aggregate([
    {
      '$search': {
        'index': 'default',
        'text': {
          'path': 'title',
          'query': 'boat',
          'synonyms': 'transportSynonyms'
        }
      }
    },
    {
      '$limit': 10
    },
    {
      '$project': {
        '_id': 0,
        'title': 1,
        'score': {
          '$meta': 'searchScore'
        }
      }
    }
  ])

  for i in result:
      print(i)

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  python synonyms-explicit-query.py
  ```

  ```python
  {'title': 'Vessel', 'score': 5.373150825500488}
  {'title': 'Boats', 'score': 4.589139938354492}
  {'title': 'And the Ship Sails On', 'score': 4.3452959060668945}
  {'title': 'Broken Vessels', 'score': 4.3452959060668945}
  {'title': 'Sailing to Paradise', 'score': 4.3452959060668945}
  {'title': 'Boat People', 'score': 3.711261749267578}
  {'title': 'Boat Trip', 'score': 3.711261749267578}
  {'title': 'Three Men in a Boat', 'score': 3.1153182983398438}
  {'title': 'The Glass Bottom Boat', 'score': 3.1153182983398438}
  {'title': 'Jack Goes Boating', 'score': 3.1153182983398438}
  ```

  The MongoDB Search results contain movies with `boat`, `vessel`, and `sail` in the `title` field because we configured `boat`, `vessel`, and `sail` to be synonyms of `boat` in the synonyms source collection named `sample_synonyms`, which is specified in the index for the collection.

  MongoDB Search returns the following documents only for a search of the word `vessel` in the results:

  ```json
  { "title" : "Vessel", "score" : 5.373150825500488 }
  { "title" : "Broken Vessels", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. To test this, replace the value of the `query` field in the query above with `vessel` and run the query again.

  Similarly, MongoDB Search returns the following documents only in the results for a search of the term `sail`:

  ```json
  { "title" : "And the Ship Sails On", "score" : 4.3452959060668945 }
  { "title" : "Sailing to Paradise", "score" : 4.3452959060668945 }
  ```

  MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test this example, replace the value of the `query` field in the query above with `sail` and run the query again.

</Tab>

</Tabs>

## Run advanced MongoDB Search queries if you created the index with multiple synonym mappings.

These code examples perform the following tasks:

- Imports `pymongo`, MongoDB's Python driver, and the `dns` module, which is required to connect `pymongo` to `Atlas` using a DNS (Domain Name System) seed list connection string.

- Creates an instance of the `MongoClient` class to establish a connection to your cluster.

- Iterates over the cursor to print the documents that match the query.

MongoDB Search query results vary based on the type of word mapping defined in the synonyms source collection.

<Tabs>

<Tab name="equivalent Mapping Type">

- Create a file named `synonyms-equivalent-query.py`.

- Copy and paste the code example into the `synonyms-equivalent.py` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `automobile` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `automobile` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `attire` also and  uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `attire` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```python
  import pymongo
  import dns

  client = pymongo.MongoClient('<connection-string>')
  result = client['sample_mflix']['movies'].aggregate([
      {
          '$search': {
              'index': 'default',
              'compound': {
                  'should': [
                      {
                          'text': {
                              'path': 'title',
                              'query': 'automobile',
                              'synonyms': 'transportSynonyms'
                          }
                      }, {
                          'text': {
                              'path': 'title',
                              'query': 'attire',
                              'synonyms': 'attireSynonyms'
                          }
                      }
                  ]
              }
          }
      }, {
          '$limit': 10
      }, {
          '$project': {
              '_id': 0,
              'title': 1,
              'score': {
                  '$meta': 'searchScore'
              }
          }
      }
  ])

  for i in result:
      print(i)

  ```

- Before you run the sample, replace `<connection-string>` with your Atlas connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  python synonyms-equivalent-query.py
  ```

  ```json
  {'title': 'The Dress', 'score': 4.812004089355469}
  {'title': 'Cars', 'score': 4.197734832763672}
  {'title': 'Dressed to Kill', 'score': 3.891493320465088}
  {'title': '27 Dresses', 'score': 3.891493320465088}
  {'title': 'Planes, Trains & Automobiles', 'score': 3.8511905670166016}
  {'title': 'Car Wash', 'score': 3.39473032951355}
  {'title': 'Used Cars', 'score': 3.39473032951355}
  {'title': 'Blue Car', 'score': 3.39473032951355}
  {'title': 'Cars 2', 'score': 3.39473032951355}
  {'title': 'Stealing Cars', 'score': 3.39473032951355}
  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `car` in the `title` field for the query term `automobile` because we configured `automobile` to be a synonym of `car`, `vehicle`, and `automobile` in the synonyms source collection named `transport_synonyms`. The result also contains movies with `dress` in the title field for the query term `attire` because we configured `attire` to be a synonym of `dress`, `apparel`, and `attire` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search returns the same results for a search of `car` or `vehicle` in the `transport_synonyms` source collection and  `dress` or `apparel` in the `attire_synonyms` source collection. To test this example, replace the value of the `query` field in the query above with `car` or `vehicle` and replace the value of the `query` field in the query above with `dress` or `apparel`, and run the query again.

</Tab>

<Tab name="explicit Mapping Type">

- Create a file named `synonyms-explicit-query.py`.

- Copy and paste the code example into the `synonyms-explicit.py` file.

  The code example contains the following stages:

  - [`$search`](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/aggregation-stages/search/#mongodb-pipeline-pipe.-search) stage to search the `title` field for the word `boat` and uses the synonym mapping definition named `transportSynonyms` to search for words configured as synonyms of the query word `boat` in the synonyms source collection named `transport_synonyms`. The query searches the `title` field for the word `hat` also and uses the synonym mapping definition named `attireSynonyms` to search for words configured as synonyms of the query word `hat` in the synonyms source collection named `attire_synonyms`.

  - [`$limit`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/limit/#mongodb-pipeline-pipe.-limit) stage to limit the output to 10 results.

  - [`$project`](https://www.mongodb.com/docs/manual/reference/operator/aggregation/project/#mongodb-pipeline-pipe.-project) stage to exclude all fields except `title` and add a field named `score`.

  ```python
  import pymongo
  import dns

  client = pymongo.MongoClient('<connection-string>')
  result = client['sample_mflix']['movies'].aggregate([
      {
          '$search': {
              'index': 'default',
              'compound': {
                  'should': [
                      {
                          'text': {
                              'path': 'title',
                              'query': 'boat',
                              'synonyms': 'transportSynonyms'
                          }
                      }, {
                          'text': {
                              'path': 'title',
                              'query': 'hat',
                              'synonyms': 'attireSynonyms'
                          }
                      }
                  ]
              }
          }
      }, {
          '$limit': 10
      }, {
          '$project': {
              '_id': 0,
              'title': 1,
              'score': {
                  '$meta': 'searchScore'
              }
          }
      }
  ])

  for i in result:
      print(i)

  ```

- Before you run the sample, replace `<connection-string>` with your connection string. Ensure that your connection string includes your database user's credentials.

- Run the following command to query your collection:

  ```bash
  python synonyms-explicit-query.py
  ```

  ```json
  {'title': 'Fedora', 'score': 5.673145294189453}
  {'title': 'Vessel', 'score': 5.373150825500488}
  {'title': 'Boats', 'score': 4.589139938354492}
  {'title': 'And the Ship Sails On', 'score': 4.3452959060668945}
  {'title': 'Broken Vessels', 'score': 4.3452959060668945}
  {'title': 'Sailing to Paradise', 'score': 4.3452959060668945}
  {'title': 'Top Hat', 'score': 4.066137313842773}
  {'title': 'A Hatful of Rain', 'score': 4.066137313842773}
  {'title': 'Boat People', 'score': 3.711261749267578}
  {'title': 'Boat Trip', 'score': 3.711261749267578}

  ```

  The MongoDB Search results contain documents for both the search terms. The results contain movies with `vessel`, `boat`, and `sail` in the `title` field for the query term `boat` because we configured `boat` to be a synonym of `boat`, `vessel`, and `sail` in the synonyms source collection named `transport_synonyms`.

  MongoDB Search doesn't include documents with either `boat` or `sail` in the `title` field in the results for a search of the term `vessel` because we didn't configure `vessel` to be a synonym of either `boat` or `sail` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `boat` or `vessel` in the `title` field in the results for a search of the term `sail` because we didn't configure `sail` to be a synonym of either `boat` or `vessel` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `vessel` or `sail` and run the query again.

  The result also contains movies with `fedora` and `hat` in the title field for the query term `hat` because we configured `hat` to be a synonym of `hat`, `fedora`, and `headgear` in the synonyms source collection named `attire_synonyms`.

  MongoDB Search doesn't include documents with either `hat` or `fedora` in the `title` field in the results for a search of the term `headgear` because we didn't configure `headgear` to be a synonym of either `hat` or `fedora` in the synonyms source collection. Similary, MongoDB Search doesn't include documents with either `hat` or `headgear` in the `title` field in the results for a search of the term `fedora` because we didn't configure `fedora` to be a synonym of either `hat` or `headgear` in the synonyms source collection. To test these examples, replace the value of the `query` field in the query above with `fedora` or `headgear` and run the query again.

</Tab>

</Tabs>

