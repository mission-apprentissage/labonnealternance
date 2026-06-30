# Process Data with Analyzers

You can control how MongoDB Search turns a `string` field's contents into searchable terms using *analyzers*. Analyzers are policies that combine a tokenizer, which extracts tokens from text, with filters that you define. MongoDB Search applies your filters to the tokens to create indexable terms that correct for differences in punctuation, capitalization, filler words, and more.

You can specify analyzers in your index definition for MongoDB Search to use when building an index or searching your database. You can also specify [alternate (multi) analyzers](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/multi/#std-label-ref-multi-analyzers) to use when indexing individual fields, or define your own [custom analyzers](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/custom/#std-label-custom-analyzers).

## Syntax

The following tabs show the syntax of the analyzer options you can configure in your index definition:

<Tabs>

<Tab name="Index Analyzer">

You can specify an index analyzer for MongoDB Search to apply to string fields when building an index using the `analyzer` option in your MongoDB Search index definition.

MongoDB Search applies the top-level analyzer to all fields in the index definition unless you specify a different analyzer for a field within the `mappings.fields` definition for your field.

If you omit the `analyzer` option, MongoDB Search defaults to using the [Standard Analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/standard/#std-label-ref-standard-analyzer).

```json
{
  "analyzer": "<analyzer-for-index>",
  "mappings": {
    "fields": {
      "<string-field-name>": {
        "type": "string",
        "analyzer": "<analyzer-for-field>"
      }
    }
  }
}
```

</Tab>

<Tab name="Search Analyzer">

You can specify a search analyzer for MongoDB Search to apply to query text using the `searchAnalyzer` option in your MongoDB Search index definition.

If you omit the `searchAnalyzer` option, MongoDB Search defaults to using the analyzer that you specify for the `analyzer` option. If you omit both options, MongoDB Search defaults to using the [Standard Analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/standard/#std-label-ref-standard-analyzer).

```json
{
  "searchAnalyzer": "<analyzer-for-query>",
  "mappings": {
    "dynamic": <boolean>,
    "fields": { <field-definition> }
  }
}
```

</Tab>

<Tab name="Multi Analyzer">

You can specify an alternate analyzer for MongoDB Search to apply to string fields when building an index using the `multi` option in your MongoDB Search index definition.

To use the alternate analyzer in a MongoDB Search query, you must specify the name of the alternate analyzer in the `multi` field of your query operator's [query path](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/path-construction/#std-label-ref-path).

To learn more, see [Multi Analyzer](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/multi/#std-label-ref-multi-analyzers).

```json
{
  "mappings": {
    "fields": {
      "<string-field-name>": {
        "type": "string",
        "analyzer": "<default-analyzer-for-field>",
        "multi": {
          "<alternate-analyzer-name>": {
            "type": "string",
            "analyzer": "<alternate-analyzer-for-field>"
          }
        }
      }
    }
  }
}
```

</Tab>

<Tab name="Custom Analyzer">

You can define one or more custom analyzers to transform, filter, and group sequences of characters using the `analyzers` option in your MongoDB Search index.

To use a custom analyzer that you define, specify its `name` value in your index definition's `analyzer`, `searchAnalyzer`, or `multi.analyzer` option.

To learn more, see [Custom Analyzers](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/custom/#std-label-custom-analyzers).

```json
{
  "mappings": {
    "dynamic": <boolean>,
    "fields": { <field-definition> }
  },
  "analyzers": [
    {
      "name": "<custom-analyzer-name>",
      "tokenizer": {
        "type": "<tokenizer-type>"
      }
    }
  ]
}
```

</Tab>

</Tabs>

Watch this video to see how MongoDB Search uses analyzers to break documents into searchable units and build an inverted index.

*Duration: 8 Minutes*

## Analyzers

MongoDB Search provides the following built-in analyzers:

<table>
<tr>
<th id="Analyzer">
Analyzer

</th>
<th id="Description">
Description

</th>
</tr>
<tr>
<td headers="Analyzer">
[Standard](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/standard/#std-label-ref-standard-analyzer)

</td>
<td headers="Description">
Uses the default analyzer for all MongoDB Search indexes and queries.

</td>
</tr>
<tr>
<td headers="Analyzer">
[Simple](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/simple/#std-label-ref-simple-analyzer)

</td>
<td headers="Description">
Divides text into searchable terms wherever it finds a non-letter character.

</td>
</tr>
<tr>
<td headers="Analyzer">
[Whitespace](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/whitespace/#std-label-ref-whitespace-analyzer)

</td>
<td headers="Description">
Divides text into searchable terms wherever it finds a whitespace character.

</td>
</tr>
<tr>
<td headers="Analyzer">
[Keyword](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/keyword/#std-label-ref-keyword-analyzer)

</td>
<td headers="Description">
Indexes text fields as single terms.

</td>
</tr>
<tr>
<td headers="Analyzer">
[Language](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/language/#std-label-ref-language-analyzers)

</td>
<td headers="Description">
Provides a set of language-specific text analyzers.

</td>
</tr>
</table>If you don't specify an analyzer in your index definition, MongoDB uses the default [standard](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/analyzers/standard/#std-label-ref-standard-analyzer) analyzer.

## Normalizers

Normalizers produce only a single token at the end of analysis. You can configure normalizers only in the field definition for the MongoDB Search
[token](https://mongodbcom-cdn.staging.corp.mongodb.com/docs/atlas/atlas-search/field-types/token-type/#std-label-bson-data-types-token) type. MongoDB Search provides the following normalizers:

<table>
<tr>
<th id="Normalizer">
Normalizer

</th>
<th id="Description">
Description

</th>
</tr>
<tr>
<td headers="Normalizer">
`lowercase`

</td>
<td headers="Description">
Transforms text in string fields to lowercase and creates a single token for the whole string.

</td>
</tr>
<tr>
<td headers="Normalizer">
`none`

</td>
<td headers="Description">
Doesn't perform any transformation, but still creates a single token.

</td>
</tr>
</table>

